import { Injectable, NotFoundException } from '@nestjs/common';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { AvailableVaultsQueryDto } from '../contract/dto/available-vaults-query.dto';
import { Vault } from './vault.entity';
import { VaultRepository } from './vault.repository';
import { CreateVaultDto } from './create-vault.dto';
import { UpdateVaultDto } from './update-vault.dto';
import { VaultListQueryDto } from './vault-list-query.dto';

@Injectable()
export class VaultService {
  constructor(private readonly vaultRepository: VaultRepository) {}

  async list(query: VaultListQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const { items, total } = await this.vaultRepository.listPaginated(query.resolvedSearch, skip, limit);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async listByBlock(blockId: string) {
    return this.vaultRepository.listByBlock(blockId);
  }

  async getAvailableForContracts(query: AvailableVaultsQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const currentDate = new Date();

    const [items, total] = await Promise.all([
      this.vaultRepository.findAvailableForContracts(query.resolvedSearch, query.resolvedType, currentDate, skip, limit),
      this.vaultRepository.countAvailableForContracts(query.resolvedSearch, query.resolvedType, currentDate),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getContractContext(vaultId?: string) {
    const vault = await this.vaultRepository.findContractContextById(vaultId)
      ?? null;

    return {
      vault,
      totalAmount: vault?.rentalPrice ?? 0,
      contractTypeKey: this.resolveContractTypeKey(vault),
    };
  }

  async getById(id: string) {
    const vault = await this.vaultRepository.findById(id);
    if (!vault || vault.isActive === false) {
      throw new NotFoundException('Vault not found');
    }

    return vault;
  }

  async create(data: CreateVaultDto) {
    const vault = Vault.create(data);
    return this.vaultRepository.create(vault);
  }

  async update(id: string, data: UpdateVaultDto) {
    await this.getById(id);
    const vault = Vault.create(data);
    return this.vaultRepository.update(id, vault);
  }

  async remove(id: string) {
    await this.getById(id);
    return this.vaultRepository.update(id, Vault.create({ isActive: false }));
  }

  private resolveContractTypeKey(vault: Awaited<ReturnType<VaultRepository['findContractContextById']>>): 'default' | 'niche' | 'tomb' {
    const vaultType = (vault?.type || vault?.floor?.block?.name || 'vault').toLowerCase();

    if (vaultType.includes('niche')) {
      return 'niche';
    }

    if (vaultType.includes('tomb')) {
      return 'tomb';
    }

    return 'default';
  }
}
