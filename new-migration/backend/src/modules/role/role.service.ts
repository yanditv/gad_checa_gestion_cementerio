import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleRepository } from './role.repository';

function normalizeRoleName(name: string): string {
  return name.toUpperCase();
}

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async list() {
    return this.roleRepository.findMany();
  }

  async getById(id: string) {
    const role = await this.roleRepository.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async create(data: CreateRoleDto) {
    const { name, permissions } = data;

    const normalizedName = normalizeRoleName(name);
    const exists = await this.roleRepository.findByNormalizedName(normalizedName);
    if (exists) {
      throw new ConflictException('Role already exists');
    }

    return this.roleRepository.create({
      name,
      normalizedName,
      permissions: permissions ?? null,
    });
  }

  async update(id: string, data: UpdateRoleDto) {
    await this.getById(id);

    const { name, permissions } = data;
    let normalizedName: string | undefined;

    if (name) {
      normalizedName = normalizeRoleName(name);
    }

    if (normalizedName) {
      const existing = await this.roleRepository.findAnotherByNormalizedName(normalizedName, id);
      if (existing) {
        throw new ConflictException('Another role with this name already exists');
      }
    }

    const roleData: { name?: string; normalizedName?: string; permissions?: string | null } = {};

    if (name) {
      roleData.name = name;
      roleData.normalizedName = normalizedName;
    }

    if (permissions !== undefined) {
      roleData.permissions = permissions;
    }

    return this.roleRepository.update(id, roleData);
  }

  async remove(id: string) {
    await this.getById(id);
    await this.roleRepository.deleteUserRolesByRoleId(id);
    return this.roleRepository.delete(id);
  }
}
