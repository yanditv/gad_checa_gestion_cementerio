import { Injectable, NotFoundException } from '@nestjs/common';import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { Bloque } from './bloque.entity';
import { BloqueRepository } from './bloque.repository';

@Injectable()
export class BloqueService {
  constructor(private readonly bloqueRepository: BloqueRepository) {}

  async list(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const { items, total } = await this.bloqueRepository.listPaginated(search, skip, limit);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async listByCemetery(cemeteryId: number) {
    return this.bloqueRepository.listByCemetery(cemeteryId);
  }

  async getById(id: number) {
    const block = await this.bloqueRepository.findById(id);
    if (!block || block.estado === false) {
      throw new NotFoundException('Block not found');
    }

    return block;
  }

  async create(data: any) {
    const block = Bloque.create(data);
    return this.bloqueRepository.create(block);
  }

  async update(id: number, data: any) {
    await this.getById(id);
    const block = Bloque.create(data);
    return this.bloqueRepository.update(id, block);
  }

  async remove(id: number) {
    await this.getById(id);
    return this.bloqueRepository.update(id, Bloque.create({ estado: false }));
  }
}
