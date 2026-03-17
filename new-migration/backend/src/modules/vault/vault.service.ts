import { Injectable, NotFoundException } from '@nestjs/common';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { AvailableVaultsQueryDto } from '../contract/dto/available-vaults-query.dto';
import { VaultRepository } from './vault.repository';
import { CreateVaultDto } from './dto/create-vault.dto';
import { UpdateVaultDto } from './dto/update-vault.dto';
import { VaultListQueryDto } from './dto/vault-list-query.dto';

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
    const search = query.resolvedSearch;

    const [items, total] = await Promise.all([
      this.vaultRepository.findAvailableForContracts(search, query.resolvedType, currentDate, skip, limit),
      this.vaultRepository.countAvailableForContracts(search, query.resolvedType, currentDate),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getContractContext(vaultId?: string) {
    const vault = vaultId
      ? (await this.vaultRepository.findContractContextById(vaultId)) ?? null
      : null;

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
    return this.vaultRepository.create(data);
  }

  async update(id: string, data: UpdateVaultDto) {
    await this.getById(id);
    return this.vaultRepository.update(id, data);
  }

  async remove(id: string) {
    await this.getById(id);
    return this.vaultRepository.update(id, { isActive: false });
  }

  private resolveContractTypeKey(vault: string){
    const vaultType = vault?.type.toLowerCase();
    if(! ['niche', 'tomb'].includes(vault)) return 'default'
    return vaultType
  }
}
