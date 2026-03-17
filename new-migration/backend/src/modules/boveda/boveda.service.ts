import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { Boveda } from './boveda.entity';
import { BovedaRepository } from './boveda.repository';

@Injectable()
export class BovedaService {
  constructor(private readonly bovedaRepository: BovedaRepository) {}

  async list(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim() || query.busqueda?.trim();

    const { items, total } = await this.bovedaRepository.listPaginated(search, skip, limit);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async listByBlock(blockId: string) {
    return this.bovedaRepository.listByBlock(blockId);
  }

  async getById(id: string) {
    const vault = await this.bovedaRepository.findById(id);
    if (!vault || vault.isActive === false) {
      throw new NotFoundException('Vault not found');
    }

    return vault;
  }

  async create(data: any) {
    const vault = Boveda.create(data);
    return this.bovedaRepository.create(vault);
  }

  async update(id: string, data: any) {
    await this.getById(id);
    const vault = Boveda.create(data);
    return this.bovedaRepository.update(id, vault);
  }

  async remove(id: string) {
    await this.getById(id);
    return this.bovedaRepository.update(id, Boveda.create({ isActive: false }));
  }
}
