import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from './role.entity';

@Injectable()
export class RolRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return this.role.findMany({
      include: {
        usuarios: {
          include: { usuario: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  findById(id: string) {
    return this.role.findUnique({
      where: { id },
      include: {
        usuarios: {
          include: { usuario: true },
        },
      },
    });
  }

  findByNormalizedName(normalizedName: string) {
    return this.role.findUnique({
      where: { nombreNormalizado: normalizedName },
    });
  }

  findAnotherByNormalizedName(normalizedName: string, id: string) {
    return this.role.findFirst({
      where: { nombreNormalizado: normalizedName, id: { not: id } },
    });
  }

  create(data: Role) {
    return this.role.create({
      data: {
        nombre: data.name,
        nombreNormalizado: data.normalizedName,
        permisos: data.permissions || null,
      },
    });
  }

  update(id: string, data: Partial<Role>) {
    return this.role.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { nombre: data.name } : {}),
        ...(data.normalizedName !== undefined ? { nombreNormalizado: data.normalizedName } : {}),
        ...(data.permissions !== undefined ? { permisos: data.permissions } : {}),
      },
      include: {
        usuarios: {
          include: { usuario: true },
        },
      },
    });
  }

  deleteUserRolesByRoleId(roleId: string) {
    return this.userRole.deleteMany({
      where: { rolId: roleId },
    });
  }

  delete(id: string) {
    return this.role.delete({
      where: { id },
    });
  }

  private get role() {
    return this.prisma.rol;
  }

  private get userRole() {
    return this.prisma.usuarioRol;
  }
}