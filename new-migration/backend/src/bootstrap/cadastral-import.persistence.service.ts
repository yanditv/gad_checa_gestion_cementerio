import { Injectable } from '@nestjs/common';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  addYears,
  buildMigrationId,
  calculateMonthCount,
  CADASTRAL_IMPORT_SOURCE,
  DEFAULT_INSTALLMENT_COUNT,
  DEFAULT_VAULT_AMOUNT,
  DEFAULT_VAULT_TYPE,
  getVaultNumber,
  splitFullName,
} from './cadastral-import.utils';
import { CadastralRecord, CreateImportedContractParams } from './cadastral-import.types';

@Injectable()
export class CadastralImportPersistenceService {
  private cemeteryId?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async countContracts(): Promise<number> {
    return this.prisma.contract.count();
  }

  async clearExistingData() {
    await this.prisma.installmentPayment.deleteMany();
    await this.prisma.payment.deleteMany();
    await this.prisma.installment.deleteMany();
    await this.prisma.contract.deleteMany();
    await this.prisma.deceased.deleteMany();
    await this.prisma.responsibleParty.deleteMany();

    await this.prisma.vault.updateMany({
      data: { ownerId: null },
    });

    await this.prisma.owner.deleteMany();
    await this.prisma.person.deleteMany({
      where: { personType: { in: ['Person', 'Responsible', 'Owner'] } },
    });
    await this.prisma.vault.deleteMany();
    await this.prisma.floor.deleteMany();
    await this.prisma.block.deleteMany();
  }

  async upsertBlock(name: string, adminUserId: string) {
    const cemeteryId = await this.getCemeteryId();
    const normalizedName = name.trim();
    const existing = await this.prisma.block.findFirst({
      where: { name: normalizedName, cemeteryId },
    });

    if (existing) {
      return existing;
    }

    const createdBlock = await this.prisma.block.create({
      data: {
        name: normalizedName,
        description: `Imported from cadastral registry: ${normalizedName}`,
        isActive: true,
        cemeteryId,
      },
    });

    await this.logCreate('Block', createdBlock.id, adminUserId);
    return createdBlock;
  }

  async upsertFloor(blockId: string) {
    const existing = await this.prisma.floor.findFirst({
      where: { blockId, number: 1 },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.floor.create({
      data: {
        blockId,
        number: 1,
        description: 'Imported',
        isActive: true,
      },
    });
  }

  async upsertVault(record: CadastralRecord, blockId: string, floorId: string, adminUserId: string) {
    const vaultNumber = getVaultNumber(record).trim();
    const existing = await this.prisma.vault.findFirst({
      where: { number: vaultNumber, blockId },
    });

    if (existing) {
      return existing;
    }

    const createdVault = await this.prisma.vault.create({
      data: {
        number: vaultNumber,
        capacity: 1,
        type: record.vaultType || DEFAULT_VAULT_TYPE,
        isActive: true,
        notes: record.notes || 'Imported from cadastral registry',
        price: DEFAULT_VAULT_AMOUNT,
        rentalPrice: DEFAULT_VAULT_AMOUNT,
        blockId,
        floorId,
      },
    });

    await this.logCreate('Vault', createdVault.id, adminUserId);
    return createdVault;
  }

  async markVaultAsAvailable(vaultId: string) {
    await this.prisma.vault.update({
      where: { id: vaultId },
      data: { isActive: true, ownerId: null },
    });
  }

  async markVaultAsOccupied(vaultId: string, ownerId: string) {
    await this.prisma.vault.update({
      where: { id: vaultId },
      data: { isActive: false, ownerId },
    });
  }

  async upsertDeceased(record: CadastralRecord, vaultId: string, adminUserId: string) {
    const { firstName, lastName } = splitFullName(record.deceasedName || 'UNKNOWN DECEASED', 'UNKNOWN', '(IMPORT)');
    const existing = await this.prisma.deceased.findFirst({
      where: {
        firstName: { equals: firstName, mode: 'insensitive' },
        lastName: { equals: lastName, mode: 'insensitive' },
      },
    });

    if (existing) {
      return existing;
    }

    const createdDeceased = await this.prisma.deceased.create({
      data: {
        firstName,
        lastName,
        identificationNumber: '9999999999',
        deathDate: record.contractDate ?? new Date(),
        isActive: true,
        vaultId,
      },
    });

    await this.logCreate('Deceased', createdDeceased.id, adminUserId);
    return createdDeceased;
  }

  async upsertResponsiblePerson(record: CadastralRecord, adminUserId: string) {
    const representativeName = record.representativeName || 'UNKNOWN TAXPAYER';
    const { firstName, lastName } = splitFullName(representativeName, 'UNKNOWN', '(IMPORT)');
    const identificationNumber =
      record.contactNumber ||
      buildMigrationId(
        `${firstName} ${lastName}|${record.rawVaultNumber}|${record.blockName}|${record.excelId}`,
      );

    const existing = await this.prisma.person.findFirst({
      where: { identificationNumber, personType: 'Person' },
    });

    if (existing) {
      return existing;
    }

    const createdPerson = await this.prisma.person.create({
      data: {
        identificationNumber,
        firstName,
        lastName,
        phone: record.contactNumber || null,
        email: record.email || `${identificationNumber}@migration.local`,
        address: 'CEMETERY',
        identificationType: 'CED',
        isActive: true,
        personType: 'Person',
      },
    });

    await this.logCreate('Person', createdPerson.id, adminUserId);
    return createdPerson;
  }

  async upsertOwner(personId: string) {
    const existing = await this.prisma.owner.findFirst({ where: { personId } });
    if (existing) {
      return existing;
    }

    return this.prisma.owner.create({
      data: { personId, isActive: true },
    });
  }

  async upsertResponsibleParty(personId: string, ownerId: string) {
    const existing = await this.prisma.responsibleParty.findFirst({
      where: { personId, ownerId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.responsibleParty.create({
      data: {
        personId,
        ownerId,
        relationship: 'Representative',
        isActive: true,
      },
    });
  }

  async createContract(params: CreateImportedContractParams) {
    let lastError: unknown;

    for (let attempt = 0; attempt < 5; attempt++) {
      const sequentialNumber = await this.generateContractNumber(params.vaultId);

      try {
        const contract = await this.prisma.contract.create({
          data: {
            sequentialNumber,
            startDate: params.startDate,
            endDate: params.endDate,
            monthCount: calculateMonthCount(params.startDate, params.endDate),
            totalAmount: DEFAULT_VAULT_AMOUNT,
            isActive: true,
            notes: params.notes,
            vaultId: params.vaultId,
            responsiblePartyId: params.responsiblePartyId,
            deceasedId: params.deceasedId,
          },
        });

        await this.logCreate('Contract', contract.id, params.adminUserId);
        return contract;
      } catch (error) {
        if (!this.isSequentialCollision(error)) {
          throw error;
        }

        lastError = error;
      }
    }

    throw lastError;
  }

  async createInstallmentsAndInitialPayment(contractId: string, totalAmount: unknown, personId: string, startDate: Date) {
    const installmentAmount = Number((Number(totalAmount) / DEFAULT_INSTALLMENT_COUNT).toFixed(2));
    const installments = await Promise.all(
      Array.from({ length: DEFAULT_INSTALLMENT_COUNT }, (_, index) =>
        this.prisma.installment.create({
          data: {
            contractId,
            number: index + 1,
            amount: installmentAmount,
            dueDate: addYears(startDate, index + 1),
            paidAt: new Date(),
            interestAmount: 0,
            isActive: true,
          },
        }),
      ),
    );

    const payment = await this.prisma.payment.create({
      data: {
        receiptNumber: `MIGRATION-${contractId}-${Date.now()}`,
        amount: installments.reduce((sum, installment) => sum + Number(installment.amount), 0),
        paidAt: new Date(),
        paymentMethod: 'Cash',
        reference: `MIGRATION-${personId}`,
        note: 'Initial migration payment',
        isActive: true,
      },
    });

    await this.prisma.installmentPayment.createMany({
      data: installments.map((installment) => ({ installmentId: installment.id, paymentId: payment.id })),
    });
  }

  private async getCemeteryId(): Promise<string> {
    if (this.cemeteryId) {
      return this.cemeteryId;
    }

    const cemetery = await this.prisma.cemetery.findFirst({
      orderBy: { id: 'asc' },
      select: { id: true },
    });

    if (!cemetery) {
      throw new Error('No cemetery exists for cadastral import');
    }

    this.cemeteryId = cemetery.id;
    return cemetery.id;
  }

  private async generateContractNumber(vaultId: string): Promise<string> {
    const year = new Date().getFullYear();
    const vault = await this.prisma.vault.findUnique({
      where: { id: vaultId },
      include: { floor: { include: { block: true } } },
    });

    const vaultType = (vault?.type || vault?.floor?.block?.name || 'Vault').toLowerCase();
    const basePrefix = vaultType.includes('niche') ? 'NCH' : vaultType.includes('tomb') ? 'TML' : 'CTR';
    const prefix = `${basePrefix}-GADCHECA-${year}-`;

    const matchingContracts = await this.prisma.contract.findMany({
      where: {
        sequentialNumber: { startsWith: prefix },
      },
      select: { sequentialNumber: true },
    });

    const nextNumber =
      matchingContracts.reduce((highestSequence, contract) => {
        const currentSequence = Number(contract.sequentialNumber.split('-').pop() || '0');
        return Number.isFinite(currentSequence) ? Math.max(highestSequence, currentSequence) : highestSequence;
      }, 0) + 1;

    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  private isSequentialCollision(error: unknown): boolean {
    return Boolean(
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002' &&
      'meta' in error &&
      Array.isArray((error as { meta?: { target?: unknown } }).meta?.target) &&
      (error as { meta?: { target?: unknown[] } }).meta?.target?.includes('sequentialNumber')
    );
  }

  private async logCreate(entityName: string, entityId: string, actorId: string) {
    await this.auditService.log({
      action: 'CREATE',
      entityName,
      entityId,
      actorId,
      details: {
        source: CADASTRAL_IMPORT_SOURCE,
      },
    });
  }
}