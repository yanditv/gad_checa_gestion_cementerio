import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { DeceasedService } from '../deceased/deceased.service';
import { InstallmentService } from '../installment/installment.service';
import { PaymentService } from '../payment/payment.service';
import { PersonService } from '../person/person.service';
import { VaultService } from '../vault/vault.service';
import {
  CONTRACT_CREATION_PAYMENT_TYPES,
  CONTRACT_NUMBER_OWNER_CODE,
  CONTRACT_NUMBER_PREFIX,
  DEFAULT_CONTRACT_MONTH_COUNT,
} from './contract.constants';
import { ContractRepository } from './contract.repository';
import { AvailableVaultsQueryDto } from './dto/available-vaults-query.dto';
import { ContractListQueryDto } from './dto/contract-list-query.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateContractRequestDto } from './dto/create-contract-request.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractService {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly deceasedService: DeceasedService,
    private readonly personService: PersonService,
    private readonly installmentService: InstallmentService,
    private readonly paymentService: PaymentService,
    private readonly vaultService: VaultService,
  ) {}

  async getCreationMetadata() {
    const [discounts, banks] = await this.contractRepository.getCreationMetadata();

    return {
      discounts,
      banks,
      paymentTypes: CONTRACT_CREATION_PAYMENT_TYPES,
      defaultMonthCount: DEFAULT_CONTRACT_MONTH_COUNT,
    };
  }

  async getAvailableVaults(query: AvailableVaultsQueryDto) {
    return this.vaultService.getAvailableForContracts(query);
  }

  async getContractNumberPreview(vaultId?: string, isRenewal = false) {
    const contractNumber = await this.generateContractNumber(vaultId, isRenewal);
    const { vault, totalAmount } = await this.vaultService.getContractContext(vaultId);

    return {
      sequentialNumber: contractNumber,
      totalAmount,
      vault,
    };
  }

  async list(query: ContractListQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.resolvedSearch ?? '';

    const [items, total] = await Promise.all([
      this.contractRepository.findMany(search, skip, limit),
      this.contractRepository.count(search),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async create(data: CreateContractRequestDto) {
    if (data.isWizardPayload) {
      return this.createFromWizard(data);
    }

    const contractData = this.getContractData(data);
    const contractNumber = await this.generateContractNumber(contractData.vaultId, false);

    return this.contractRepository.create(
      {
        ...contractData,
        sequentialNumber: contractNumber,
      },
      data.resolvedResponsibleId,
    );
  }

  private async generateContractNumber(vaultId?: string, isRenewal = false): Promise<string> {
    const currentYear = new Date().getFullYear();
    const { contractTypeKey } = await this.vaultService.getContractContext(vaultId);
    const basePrefix = CONTRACT_NUMBER_PREFIX[contractTypeKey];
    let prefix: string = basePrefix;

    if (isRenewal) {
      prefix = `${CONTRACT_NUMBER_PREFIX.renewal}-${basePrefix}`;
    }

    const lastContract = await this.contractRepository.findLastContractByPrefix(
      `${prefix}-${CONTRACT_NUMBER_OWNER_CODE}-${currentYear}-`,
    );

    let nextNumber = 1;

    if (lastContract) {
      nextNumber = Number(lastContract.sequentialNumber.split('-').pop() || '0') + 1;
    }

    return `${prefix}-${CONTRACT_NUMBER_OWNER_CODE}-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
  }

  private async createFromWizard(payload: CreateContractRequestDto) {
    const contract = payload.wizardContract;
    const responsibles = payload.wizardResponsibles;
    const payment = payload.wizardPayment;
    const contractNumber =
      contract.resolvedSequentialNumber
      || (await this.generateContractNumber(contract.resolvedVaultId, contract.resolvedIsRenewal));

    return this.contractRepository.runInTransaction(async (tx: Prisma.TransactionClient) => {
      const createdDeceased = await this.deceasedService.createForContract(tx, payload.buildDeceasedDto());

      const responsible = await this.personService.resolveResponsiblePartyForContract(tx, responsibles[0]);

      const createdContract = await this.contractRepository.createInTransaction(tx, {
        sequentialNumber: contractNumber,
        startDate: contract.resolvedStartDate,
        endDate: contract.resolvedEndDate,
        monthCount: contract.resolvedMonthCount,
        totalAmount: contract.resolvedTotalAmount,
        notes: contract.resolvedNotes,
        isActive: true,
        sourceContractId: contract.resolvedSourceContractId,
        relatedContractId: contract.resolvedRelatedContractId,
        vaultId: contract.resolvedVaultId,
        deceasedId: createdDeceased.id,
      }, responsible.id);

      const createdInstallments = await this.installmentService.createForContract(
        tx,
        createdContract.id,
        contract.toInstallmentDtos(payment.resolvedPaidAt),
      );

      const selectedInstallments = createdInstallments.filter((installment) =>
        payment.resolvedSelectedInstallmentNumbers.includes(installment.number),
      );

      await this.paymentService.createForInstallments(
        tx,
        payment.toInstallmentPaymentDto(selectedInstallments.map((installment) => installment.id)),
      );

      return this.contractRepository.findByIdInTransaction(tx, createdContract.id);
    });
  }

  async update(id: string, data: UpdateContractDto) {
    await this.getById(id);
    const responsibleIds = data.resolvedResponsibleIds;

    if (responsibleIds) {
      await this.contractRepository.replaceResponsibleAssignments(id, responsibleIds);
    }

    return this.contractRepository.update(id, this.getContractData(data));
  }

  async remove(id: string) {
    await this.getById(id);
    return this.contractRepository.update(id, { isActive: false });
  }

  async getReports() {
    const contracts = await this.contractRepository.findReports();

    return {
      totalContracts: contracts.length,
      activeContracts: contracts.filter((contract: any) => contract.endDate && new Date(contract.endDate) > new Date()).length,
      expiredContracts: contracts.filter((contract: any) => contract.endDate && new Date(contract.endDate) <= new Date()).length,
      totalRevenue: contracts.reduce(
        (sum: number, contract: any) => sum + this.installmentService.calculatePaidAmount(contract.installments),
        0,
      ),
      contracts,
    };
  }

  private getContractData(data: {
    toContractData?: () => Partial<CreateContractDto>;
  }): Partial<CreateContractDto> {
    if (typeof data.toContractData !== 'function') {
      throw new BadRequestException('Contract payload is invalid.');
    }

    return data.toContractData();
  }
}
