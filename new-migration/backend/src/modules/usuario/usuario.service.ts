import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.usuario.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { nombre: { contains: search, mode: 'insensitive' } },
                { apellido: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { numeroIdentificacion: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        usuarioRols: {
          include: { rol: true },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        usuarioRols: {
          include: { rol: true },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async update(id: string, data: any) {
    await this.findOne(id);

    const { id: _, passwordHash, ...safeData } = data || {};
    return this.prisma.usuario.update({
      where: { id },
      data: safeData,
      include: {
        usuarioRols: {
          include: { rol: true },
        },
      },
    });
  }

  async updateEstado(id: string, estado: boolean) {
    await this.findOne(id);
    return this.prisma.usuario.update({
      where: { id },
      data: { estado },
    });
  }

  async setRoles(id: string, roleIds: string[]) {
    await this.findOne(id);

    const roles = await this.prisma.rol.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException('Uno o más roles no existen');
    }

    await this.prisma.usuarioRol.deleteMany({
      where: { usuarioId: id },
    });

    if (roleIds.length > 0) {
      await this.prisma.usuarioRol.createMany({
        data: roleIds.map((rolId) => ({ usuarioId: id, rolId })),
      });
    }

    return this.findOne(id);
  }
}
