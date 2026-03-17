import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { Contrato } from './contrato.entity';
import { ContratoRepository } from './repositories/contrato.repository';

@Injectable()
export class ContratoService {
  constructor(private readonly contratoRepository: ContratoRepository) {}

  async getCreationMetadata() {
    const [discounts, banks] = await this.contratoRepository.getCreationMetadata();

    return {
      discounts,
      banks,
      paymentTypes: ['Cash', 'Transfer', 'Bank'],
      defaultMonthCount: 5,
    };
  }

  async getAvailableVaults(query: PaginationQueryDto, type?: string) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim() || query.busqueda?.trim();
    const currentDate = new Date();

    const [items, total] = await Promise.all([
      this.contratoRepository.findAvailableVaults(search, type, currentDate, skip, limit),
      this.contratoRepository.countAvailableVaults(search, type, currentDate),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getContractNumberPreview(vaultId?: string, isRenewal = false) {
    const contractNumber = await this.generateContractNumber(vaultId, isRenewal);
    const vault = vaultId
      ? await this.contratoRepository.findVaultById(vaultId)
      : null;

    return {
      sequentialNumber: contractNumber,
      totalAmount: vault ? Number(vault.rentalPrice) : 0,
      vault,
    };
  }

  async list(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim() || query.busqueda?.trim();

    const [items, total] = await Promise.all([
      this.contratoRepository.findMany(search, skip, limit),
      this.contratoRepository.count(search),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const contract = await this.contratoRepository.findById(id);
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async create(data: any) {
    if (data?.contract && data?.deceased && data?.responsibles && data?.payment) {
      return this.createFromWizard(data);
    }

    if (data?.contrato && data?.difunto && data?.responsables && data?.pago) {
      return this.createFromWizard(data);
    }

    const contractNumber = await this.generateContractNumber(data.vaultId ?? data.bovedaId, false);

    const responsibleIds = data.responsibleIds ?? data.responsablesIds;
    const contractData = { ...data };
    delete contractData.responsibleIds;
    delete contractData.responsablesIds;

    const contract = Contrato.create({
      ...contractData,
      sequentialNumber: contractNumber,
    });

    const createdContract = await this.contratoRepository.create(contract, responsibleIds);

    return createdContract;
  }

  private async generateContractNumber(vaultId?: string, isRenewal = false): Promise<string> {
    const currentYear = new Date().getFullYear();
    const vault = vaultId
      ? await this.contratoRepository.findVaultForContractNumber(vaultId)
      : null;

    const vaultType = (vault?.type || vault?.floor?.block?.name || 'vault').toLowerCase();
    const basePrefix = vaultType.includes('nicho') ? 'NCH' : vaultType.includes('tumulo') || vaultType.includes('tumul') ? 'TML' : 'CTR';
    const prefix = isRenewal ? `RNV-${basePrefix}` : basePrefix;

    const lastContract = await this.contratoRepository.findLastContractByPrefix(
      `${prefix}-GADCHECA-${currentYear}-`,
    );

    const nextNumber = lastContract ? Number(lastContract.sequentialNumber.split('-').pop() || '0') + 1 : 1;
    return `${prefix}-GADCHECA-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
  }

  private async createFromWizard(payload: any) {
    const contract = payload.contract ?? payload.contrato;
    const deceased = payload.deceased ?? payload.difunto;
    const responsibles = payload.responsibles ?? payload.responsables;
    const payment = payload.payment ?? payload.pago;
    const contractNumber =
      contract.sequentialNumber || contract.numeroSecuencial ||
      (await this.generateContractNumber(contract.vaultId ?? contract.bovedaId, !!(contract.isRenewal ?? contract.esRenovacion)));

    return this.contratoRepository.runInTransaction(async (tx) => {
      const createdDeceased = await tx.deceased.create({
        data: {
          firstName: deceased.nombres,
          lastName: deceased.apellidos,
          identificationNumber: deceased.numeroIdentificacion || null,
          birthDate: deceased.fechaNacimiento ? new Date(deceased.fechaNacimiento) : null,
          deathDate: deceased.fechaFallecimiento ? new Date(deceased.fechaFallecimiento) : null,
          vaultId: String(contract.vaultId ?? contract.bovedaId),
          isActive: true,
        },
      });

      const responsibleIds: string[] = [];
      for (const item of responsibles as any[]) {
        if (item.id && item.esExistente) {
          let responsible = await tx.responsibleParty.findFirst({
            where: { personId: String(item.id) },
          });

          if (!responsible) {
            responsible = await tx.responsibleParty.create({
              data: {
                personId: String(item.id),
                relationship: item.parentesco || null,
                isActive: true,
              },
            });
          }

          responsibleIds.push(responsible.id);
          continue;
        }

        const person = await tx.person.create({
          data: {
            firstName: item.nombres,
            lastName: item.apellidos,
            identificationNumber: item.numeroIdentificacion,
            identificationType: item.tipoIdentificacion || 'Cedula',
            phone: item.telefono || null,
            email: item.email || null,
            address: item.direccion || null,
            personType: 'Responsable',
            isActive: true,
          },
        });

        const responsible = await tx.responsibleParty.create({
          data: {
            personId: person.id,
            relationship: item.parentesco || null,
            isActive: true,
          },
        });

        responsibleIds.push(responsible.id);
      }

      const createdContract = await tx.contract.create({
        data: {
          sequentialNumber: contractNumber,
          startDate: new Date(contract.startDate ?? contract.fechaInicio),
          endDate: contract.endDate ?? contract.fechaFin ? new Date(contract.endDate ?? contract.fechaFin) : null,
          monthCount: Number(contract.monthCount ?? contract.numeroDeMeses),
          totalAmount: Number(contract.totalAmount ?? contract.montoTotal),
          notes: contract.notes ?? contract.observaciones ?? null,
          isActive: true,
          sourceContractId: contract.sourceContractId ?? contract.contratoOrigenId ?? null,
          relatedContractId: contract.relatedContractId ?? contract.contratoRelacionadoId ?? null,
          vaultId: String(contract.vaultId ?? contract.bovedaId),
          deceasedId: createdDeceased.id,
          assignments: {
            create: responsibleIds.map((responsiblePartyId) => ({ responsiblePartyId })),
          },
        },
      });

      const installments = (contract.cuotas || []).map((installment: any, index: number) => ({
        number: index + 1,
        amount: Number(installment.monto),
        dueDate: new Date(installment.fechaVencimiento),
        paidAt: installment.pagada ? new Date(payment.fechaPago || new Date()) : null,
        contractId: createdContract.id,
        isActive: true,
        notes: null,
      }));

      if (installments.length > 0) {
        await tx.installment.createMany({ data: installments });
      }

      const createdInstallments = await tx.installment.findMany({
        where: { contractId: createdContract.id },
        orderBy: { number: 'asc' },
      });

      const selectedInstallments = createdInstallments.filter((installment) =>
        (payment.cuotasSeleccionadas || []).includes(installment.number),
      );

      if (selectedInstallments.length > 0) {
        const lastPayment = await tx.payment.findFirst({ orderBy: { id: 'desc' } });
        const nextReceiptNumber = lastPayment ? lastPayment.id + 1 : 1;
        const receiptNumber = `REC-${new Date().getFullYear()}-${nextReceiptNumber.toString().padStart(5, '0')}`;

        const createdPayment = await tx.payment.create({
          data: {
            receiptNumber,
            amount: Number(payment.monto),
            paidAt: new Date(payment.fechaPago || new Date()),
            paymentMethod: payment.tipoPago,
            reference: payment.numeroComprobante || null,
            note: payment.observacion || null,
            bankId: payment.bancoId || null,
            isActive: true,
          },
        });

        await tx.installmentPayment.createMany({
          data: selectedInstallments.map((installment) => ({
            installmentId: installment.id,
            paymentId: createdPayment.id,
          })),
        });

        await tx.installment.updateMany({
          where: { id: { in: selectedInstallments.map((installment) => installment.id) } },
          data: {
            paidAt: new Date(payment.fechaPago || new Date()),
          },
        });
      }

      return tx.contract.findUnique({
        where: { id: createdContract.id },
        include: {
          vault: { include: { block: true, floor: true } },
          deceased: true,
          assignments: { include: { responsibleParty: { include: { person: true } } } },
          installments: { orderBy: { number: 'asc' } },
        },
      });
    });
  }

  async update(id: string, data: any) {
    await this.getById(id);
    const responsibleIds = data.responsibleIds ?? data.responsablesIds;
    const contractData = { ...data };
    delete contractData.responsibleIds;
    delete contractData.responsablesIds;
    const contract = Contrato.create(contractData);

    if (responsibleIds) {
      await this.contratoRepository.replaceResponsibleAssignments(id, responsibleIds);
    }

    return this.contratoRepository.update(id, contract);
  }

  async remove(id: string) {
    await this.getById(id);
    return this.contratoRepository.update(id, Contrato.create({ isActive: false }));
  }

  async getReports() {
    const contracts = await this.contratoRepository.findReports();

    return {
      totalContracts: contracts.length,
      activeContracts: contracts.filter((contract) => contract.endDate && new Date(contract.endDate) > new Date()).length,
      expiredContracts: contracts.filter((contract) => contract.endDate && new Date(contract.endDate) <= new Date()).length,
      totalRevenue: contracts.reduce((sum, contract) => {
        const paidAmount = contract.installments.reduce((installmentSum, installment) => installmentSum + (installment.paidAt ? Number(installment.amount) : 0), 0);
        return sum + paidAmount;
      }, 0),
      contracts,
    };
  }
}
