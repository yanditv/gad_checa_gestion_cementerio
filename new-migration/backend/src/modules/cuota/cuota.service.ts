import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServicioCrudSuave } from '../../common/services/soft-delete-crud.service';
import { CuotaRepository } from './cuota.repository';

@Injectable()
export class CuotaService extends ServicioCrudSuave<
  Prisma.CuotaGetPayload<{
    include: {
      contrato: {
        include: {
          difunto: true;
          boveda: true;
        };
      };
      pagos: {
        include: {
          pago: true;
        };
      };
    };
  }>,
  number,
  Prisma.CuotaUncheckedCreateInput,
  Prisma.CuotaUncheckedUpdateInput
> {
  constructor(private readonly cuotaRepository: CuotaRepository) {
    super('Cuota');
  }

  protected get repositorio() {
    return this.cuotaRepository;
  }

  protected override relacionesDetalle() {
    return {
      contrato: { include: { difunto: true, boveda: true } },
      pagos: { include: { pago: true } },
    };
  }

  async list() {
    return this.cuotaRepository.findActive();
  }

  async listByContract(contractId: number) {
    return this.cuotaRepository.findByContract(contractId);
  }

  async listPending() {
    return this.cuotaRepository.findPending();
  }

  async getById(id: number) {
    return this.obtenerPorId(id);
  }

  async create(data: any) {
    return this.crear(data);
  }

  async update(id: number, data: any) {
    return this.actualizar(id, data);
  }

  async remove(id: number) {
    return this.eliminar(id);
  }
}
