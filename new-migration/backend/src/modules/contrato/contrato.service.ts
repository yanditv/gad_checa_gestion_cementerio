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

  async getContractNumberPreview(vaultId?: number, isRenewal = false) {
    const contractNumber = await this.generateContractNumber(vaultId, isRenewal);
    const vault = vaultId
      ? await this.contratoRepository.findVaultById(Number(vaultId))
      : null;

    return {
      sequentialNumber: contractNumber,
      totalAmount: vault ? Number(vault.precioArrendamiento) : 0,
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

  async getById(id: number) {
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

  private async generateContractNumber(vaultId?: number, isRenewal = false): Promise<string> {
    const currentYear = new Date().getFullYear();
    const vault = vaultId
      ? await this.contratoRepository.findVaultForContractNumber(Number(vaultId))
      : null;

    const vaultType = (vault?.tipo || vault?.piso?.bloque?.nombre || 'Boveda').toLowerCase();
    const basePrefix = vaultType.includes('nicho') ? 'NCH' : vaultType.includes('tumulo') || vaultType.includes('tumul') ? 'TML' : 'CTR';
    const prefix = isRenewal ? `RNV-${basePrefix}` : basePrefix;

    const lastContract = await this.contratoRepository.findLastContractByPrefix(
      `${prefix}-GADCHECA-${currentYear}-`,
    );

    const nextNumber = lastContract ? Number(lastContract.numeroSecuencial.split('-').pop() || '0') + 1 : 1;
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
      const createdDeceased = await tx.difunto.create({
        data: {
          nombre: deceased.nombres,
          apellido: deceased.apellidos,
          numeroIdentificacion: deceased.numeroIdentificacion || null,
          fechaNacimiento: deceased.fechaNacimiento ? new Date(deceased.fechaNacimiento) : null,
          fechaDefuncion: deceased.fechaFallecimiento ? new Date(deceased.fechaFallecimiento) : null,
          bovedaId: Number(contract.vaultId ?? contract.bovedaId),
          estado: true,
        },
      });

      const responsibleIds: number[] = [];
      for (const item of responsibles as any[]) {
        if (item.id && item.esExistente) {
          let responsible = await tx.responsable.findFirst({
            where: { personaId: Number(item.id) },
          });

          if (!responsible) {
            responsible = await tx.responsable.create({
              data: {
                personaId: Number(item.id),
                parentesco: item.parentesco || null,
                estado: true,
              },
            });
          }

          responsibleIds.push(responsible.id);
          continue;
        }

        const persona = await tx.persona.create({
          data: {
            nombre: item.nombres,
            apellido: item.apellidos,
            numeroIdentificacion: item.numeroIdentificacion,
            tipoIdentificacion: item.tipoIdentificacion || 'Cedula',
            telefono: item.telefono || null,
            email: item.email || null,
            direccion: item.direccion || null,
            tipoPersona: 'Responsable',
            estado: true,
          },
        });

        const responsible = await tx.responsable.create({
          data: {
            personaId: persona.id,
            parentesco: item.parentesco || null,
            estado: true,
          },
        });

        responsibleIds.push(responsible.id);
      }

      const createdContract = await tx.contrato.create({
        data: {
          numeroSecuencial: contractNumber,
          fechaInicio: new Date(contract.startDate ?? contract.fechaInicio),
          fechaFin: contract.endDate ?? contract.fechaFin ? new Date(contract.endDate ?? contract.fechaFin) : null,
          numeroDeMeses: Number(contract.monthCount ?? contract.numeroDeMeses),
          montoTotal: Number(contract.totalAmount ?? contract.montoTotal),
          observaciones: contract.notes ?? contract.observaciones ?? null,
          estado: true,
          esRenovacion: !!(contract.isRenewal ?? contract.esRenovacion),
          contratoOrigenId: contract.sourceContractId ?? contract.contratoOrigenId ?? null,
          contratoRelacionadoId: contract.relatedContractId ?? contract.contratoRelacionadoId ?? null,
          bovedaId: Number(contract.vaultId ?? contract.bovedaId),
          difuntoId: createdDeceased.id,
          responsables: {
            create: responsibleIds.map((responsableId) => ({ responsableId })),
          },
        },
      });

      const installments = (contract.cuotas || []).map((installment: any, index: number) => ({
        numero: index + 1,
        monto: Number(installment.monto),
        fechaVencimiento: new Date(installment.fechaVencimiento),
        pagada: !!installment.pagada,
        fechaPago: installment.pagada ? new Date(payment.fechaPago || new Date()) : null,
        contratoId: createdContract.id,
        estado: true,
        observaciones: null,
      }));

      if (installments.length > 0) {
        await tx.cuota.createMany({ data: installments });
      }

      const createdInstallments = await tx.cuota.findMany({
        where: { contratoId: createdContract.id },
        orderBy: { numero: 'asc' },
      });

      const selectedInstallments = createdInstallments.filter((installment) =>
        (payment.cuotasSeleccionadas || []).includes(installment.numero),
      );

      if (selectedInstallments.length > 0) {
        const lastPayment = await tx.pago.findFirst({ orderBy: { id: 'desc' } });
        const nextReceiptNumber = lastPayment ? lastPayment.id + 1 : 1;
        const receiptNumber = `REC-${new Date().getFullYear()}-${nextReceiptNumber.toString().padStart(5, '0')}`;

        const createdPayment = await tx.pago.create({
          data: {
            numeroRecibo: receiptNumber,
            monto: Number(payment.monto),
            fechaPago: new Date(payment.fechaPago || new Date()),
            metodoPago: payment.tipoPago,
            referencia: payment.numeroComprobante || null,
            observacion: payment.observacion || null,
            bancoId: payment.bancoId || null,
            estado: true,
          },
        });

        await tx.cuotaPago.createMany({
          data: selectedInstallments.map((cuota) => ({
            cuotaId: cuota.id,
            pagoId: createdPayment.id,
          })),
        });

        await tx.cuota.updateMany({
          where: { id: { in: selectedInstallments.map((cuota) => cuota.id) } },
          data: {
            pagada: true,
            fechaPago: new Date(payment.fechaPago || new Date()),
          },
        });
      }

      return tx.contrato.findUnique({
        where: { id: createdContract.id },
        include: {
          boveda: { include: { bloque: true, piso: true } },
          difunto: true,
          responsables: { include: { responsable: { include: { persona: true } } } },
          cuotas: { orderBy: { numero: 'asc' } },
        },
      });
    });
  }

  async update(id: number, data: any) {
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

  async remove(id: number) {
    await this.getById(id);
    return this.contratoRepository.update(id, Contrato.create({ estado: false }));
  }

  async getReports() {
    const contracts = await this.contratoRepository.findReports();

    return {
      totalContracts: contracts.length,
      activeContracts: contracts.filter((contract) => contract.fechaFin && new Date(contract.fechaFin) > new Date()).length,
      expiredContracts: contracts.filter((contract) => contract.fechaFin && new Date(contract.fechaFin) <= new Date()).length,
      totalRevenue: contracts.reduce((sum, contract) => {
        const paidAmount = contract.cuotas.reduce((installmentSum, installment) => installmentSum + (installment.pagada ? Number(installment.monto) : 0), 0);
        return sum + paidAmount;
      }, 0),
      contracts,
    };
  }
}
