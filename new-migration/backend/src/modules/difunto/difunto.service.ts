import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { Difunto } from './difunto.entity';
import { DifuntoRepository } from './difunto.repository';

@Injectable()
export class DifuntoService {
  constructor(private readonly difuntoRepository: DifuntoRepository) {}

  async list(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim() || query.busqueda?.trim();

    const { items, total } = await this.difuntoRepository.listPaginated(search, skip, limit);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async listByVault(vaultId: string) {
    return this.difuntoRepository.listByVault(vaultId);
  }

  async getById(id: string) {
    const deceased = await this.difuntoRepository.findById(id);
    if (!deceased || deceased.isActive === false) {
      throw new NotFoundException('Deceased record not found');
    }

    return deceased;
  }

  async create(data: any) {
    const deceased = Difunto.create(data);
    return this.difuntoRepository.create(deceased);
  }

  async update(id: string, data: any) {
    await this.getById(id);
    const deceased = Difunto.create(data);
    return this.difuntoRepository.update(id, deceased);
  }

  async remove(id: string) {
    await this.getById(id);
    return this.difuntoRepository.update(id, Difunto.create({ isActive: false }));
  }
}
