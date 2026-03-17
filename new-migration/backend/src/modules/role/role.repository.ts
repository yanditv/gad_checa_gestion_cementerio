import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from './role.entity';

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return this.role.findMany({
      include: {
        users: {
          include: { user: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.role.findUnique({
      where: { id },
      include: {
        users: {
          include: { user: true },
        },
      },
    });
  }

  findByNormalizedName(normalizedName: string) {
    return this.role.findUnique({
      where: { normalizedName },
    });
  }

  findAnotherByNormalizedName(normalizedName: string, id: string) {
    return this.role.findFirst({
      where: { normalizedName, id: { not: id } },
    });
  }

  create(data: Role) {
    return this.role.create({
      data,
    });
  }

  update(id: string, data: Partial<Role>) {
    const updateData: Partial<Role> = {};

    updateData.name = data.name ?? updateData.name;
    updateData.normalizedName = data.normalizedName ?? updateData.normalizedName;
    updateData.permissions = data.permissions ?? updateData.permissions;

    return this.role.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          include: { user: true },
        },
      },
    });
  }

  deleteUserRolesByRoleId(roleId: string) {
    return this.userRole.deleteMany({
      where: { roleId },
    });
  }

  delete(id: string) {
    return this.role.delete({
      where: { id },
    });
  }

  private get role() {
    return this.prisma.role;
  }

  private get userRole() {
    return this.prisma.userRole;
  }
}