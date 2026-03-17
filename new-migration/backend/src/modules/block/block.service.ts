import { Injectable, NotFoundException } from '@nestjs/common';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { BlockListQueryDto } from './dto/block-list-query.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { BlockRepository } from './block.repository';

@Injectable()
export class BlockService {
  constructor(private readonly blockRepository: BlockRepository) {}

  async list(query: BlockListQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.resolvedSearch;

    const { items, total } = await this.blockRepository.listPaginated(search, skip, limit);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async listByCemetery(cemeteryId: string) {
    return this.blockRepository.listByCemetery(cemeteryId);
  }

  async getById(id: string) {
    const block = await this.blockRepository.findById(id);
    if (!block || block.isActive === false) {
      throw new NotFoundException('Block not found');
    }

    return block;
  }

  async create(data: CreateBlockDto) {
    return this.blockRepository.create(data);
  }

  async update(id: string, data: UpdateBlockDto) {
    await this.getById(id);
    return this.blockRepository.update(id, data);
  }

  async remove(id: string) {
    await this.getById(id);
    return this.blockRepository.update(id, { isActive: false });
  }
}
