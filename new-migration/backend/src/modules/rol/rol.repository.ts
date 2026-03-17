import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from './role.entity';

@Injectable()
export class RolRepository {
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
      data: {
        name: data.name,
        normalizedName: data.normalizedName,
        permissions: data.permissions || null,
      },
    });
  }

  update(id: string, data: Partial<Role>) {
    return this.role.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.normalizedName !== undefined ? { normalizedName: data.normalizedName } : {}),
        ...(data.permissions !== undefined ? { permissions: data.permissions } : {}),
      },
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