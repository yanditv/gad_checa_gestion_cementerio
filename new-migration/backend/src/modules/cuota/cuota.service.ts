import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServicioCrudSuave } from '../../common/services/soft-delete-crud.service';
import { CuotaRepository } from './cuota.repository';

@Injectable()
export class CuotaService extends ServicioCrudSuave<
  Prisma.InstallmentGetPayload<{
    include: {
      contract: {
        include: {
          deceased: true;
          vault: true;
        };
      };
      installmentPayments: {
        include: {
          payment: true;
        };
      };
    };
  }>,
  number,
  Prisma.InstallmentUncheckedCreateInput,
  Prisma.InstallmentUncheckedUpdateInput
> {
  constructor(private readonly cuotaRepository: CuotaRepository) {
    super('Cuota');
  }

  protected get repositorio() {
    return this.cuotaRepository;
  }

  protected override relacionesDetalle() {
    return {
      contract: { include: { deceased: true, vault: true } },
      installmentPayments: { include: { payment: true } },
    };
  }

  async list() {
    return this.cuotaRepository.findActive();
  }

  async listByContract(contractId: string) {
    return this.cuotaRepository.findByContract(contractId);
  }

  async listPending() {
    return this.cuotaRepository.findPending();
  }

  async getById(id: string) {
    return this.obtenerPorId(id);
  }

  async create(data: any) {
    return this.crear(data);
  }

  async update(id: string, data: any) {
    return this.actualizar(id, data);
  }

  async remove(id: string) {
    return this.eliminar(id);
  }
}
