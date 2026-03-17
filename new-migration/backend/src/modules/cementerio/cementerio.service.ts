import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServicioCrudSuave } from '../../common/services/soft-delete-crud.service';
import { CementerioRepository } from './cementerio.repository';

@Injectable()
export class CementerioService extends ServicioCrudSuave<
  Prisma.CementerioGetPayload<{
    include: {
      bloques: {
        include: {
          bovedas: true;
        };
      };
    };
  }>,
  number,
  Prisma.CementerioUncheckedCreateInput,
  Prisma.CementerioUncheckedUpdateInput
> {
  constructor(private readonly cementerioRepository: CementerioRepository) {
    super('Cementerio');
  }

  protected get repositorio() {
    return this.cementerioRepository;
  }

  protected override relacionesDetalle() {
    return {
      bloques: { where: { estado: true }, include: { bovedas: true } },
    };
  }

  async list() {
    return this.cementerioRepository.findActive();
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
