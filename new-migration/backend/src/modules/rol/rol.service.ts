import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto, UpdateRoleDto } from './role.dto';
import { Role } from './role.entity';
import { RolRepository } from './rol.repository';

function normalizeRoleName(name: string): string {
  return name.trim().toUpperCase();
}

@Injectable()
export class RolService {
  constructor(private readonly rolRepository: RolRepository) {}

  async list() {
    return this.rolRepository.findMany();
  }

  async getById(id: string) {
    const role = await this.rolRepository.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async create(data: CreateRoleDto) {
    const name = (data?.name || '').trim();
    if (!name) {
      throw new ConflictException('Role name is required');
    }

    const normalizedName = normalizeRoleName(name);
    const exists = await this.rolRepository.findByNormalizedName(normalizedName);
    if (exists) {
      throw new ConflictException('Role already exists');
    }

    const role = Role.create({
      name,
      normalizedName,
      permissions: data?.permissions || null,
    });

    return this.rolRepository.create(role);
  }

  async update(id: string, data: UpdateRoleDto) {
    await this.getById(id);

    const name = (data?.name || '').trim();
    const normalizedName = name ? normalizeRoleName(name) : undefined;

    if (normalizedName) {
      const existing = await this.rolRepository.findAnotherByNormalizedName(normalizedName, id);
      if (existing) {
        throw new ConflictException('Another role with this name already exists');
      }
    }

    const role = Role.create({
      ...(name ? { name, normalizedName } : {}),
      ...(data?.permissions !== undefined ? { permissions: data.permissions } : {}),
    });

    return this.rolRepository.update(id, role);
  }

  async remove(id: string) {
    await this.getById(id);
    await this.rolRepository.deleteUserRolesByRoleId(id);
    return this.rolRepository.delete(id);
  }
}
