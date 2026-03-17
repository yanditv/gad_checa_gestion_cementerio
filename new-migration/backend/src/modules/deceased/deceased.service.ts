import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { CreateContractDeceasedDto } from './dto/create-contract-deceased.dto';
import { CreateDeceasedDto } from './dto/create-deceased.dto';
import { DeceasedListQueryDto } from './dto/deceased-list-query.dto';
import { UpdateDeceasedDto } from './dto/update-deceased.dto';
import { Deceased } from './deceased.entity';
import { DeceasedRepository } from './deceased.repository';

@Injectable()
export class DeceasedService {
  constructor(private readonly deceasedRepository: DeceasedRepository) {}

  async list(query: DeceasedListQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const { items, total } = await this.deceasedRepository.listPaginated(query.resolvedSearch, skip, limit);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async listByVault(vaultId: string) {
    return this.deceasedRepository.listByVault(vaultId);
  }

  async getById(id: string) {
    const deceased = await this.deceasedRepository.findById(id);
    if (!deceased || deceased.isActive === false) {
      throw new NotFoundException('Deceased record not found');
    }

    return deceased;
  }

  async create(data: CreateDeceasedDto) {
    const deceased = Deceased.create(data);
    return this.deceasedRepository.create(deceased);
  }

  async createForContract(tx: Prisma.TransactionClient, data: CreateContractDeceasedDto) {
    const firstName = data.firstName?.trim();
    const lastName = data.lastName?.trim();

    if (!firstName) {
      throw new BadRequestException('Deceased first name is required.');
    }

    if (!lastName) {
      throw new BadRequestException('Deceased last name is required.');
    }

    return tx.deceased.create({
      data: {
        firstName,
        lastName,
        identificationNumber: data.identificationNumber ?? null,
        birthDate: data.birthDate ?? null,
        deathDate: data.deathDate ?? null,
        vaultId: data.vaultId,
        isActive: true,
      },
    });
  }

  async update(id: string, data: UpdateDeceasedDto) {
    await this.getById(id);
    const deceased = Deceased.create(data);
    return this.deceasedRepository.update(id, deceased);
  }

  async remove(id: string) {
    await this.getById(id);
    return this.deceasedRepository.update(id, Deceased.create({ isActive: false }));
  }
}
