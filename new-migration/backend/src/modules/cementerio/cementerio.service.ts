import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServicioCrudSuave } from '../../common/services/soft-delete-crud.service';
import { CementerioRepository } from './cementerio.repository';

@Injectable()
export class CementerioService extends ServicioCrudSuave<
  Prisma.CemeteryGetPayload<{
    include: {
      blocks: {
        include: {
          vaults: true;
        };
      };
    };
  }>,
  number,
  Prisma.CemeteryUncheckedCreateInput,
  Prisma.CemeteryUncheckedUpdateInput
> {
  constructor(private readonly cementerioRepository: CementerioRepository) {
    super('Cementerio');
  }

  protected get repositorio() {
    return this.cementerioRepository;
  }

  protected override relacionesDetalle() {
    return {
      blocks: { where: { isActive: true }, include: { vaults: true } },
    };
  }

  async list() {
    return this.cementerioRepository.findActive();
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
