import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateRolDto } from './dto/request/update-rol.dto';

function normalizeRoleName(nombre: string): string {
  return nombre.trim().toUpperCase();
}

@Injectable()
export class RolService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.rol.findMany({
      include: {
        usuarios: {
          include: { usuario: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
      include: {
        usuarios: {
          include: { usuario: true },
        },
      },
    });

    if (!rol) {
      throw new NotFoundException('Rol no encontrado');
    }

    return rol;
  }

  async create(dto: UpdateRolDto) {
    const nombre = (dto?.nombre || '').trim();
    if (!nombre) {
      throw new ConflictException('El nombre del rol es obligatorio');
    }

    const nombreNormalizado = normalizeRoleName(nombre);
    const exists = await this.prisma.rol.findUnique({ where: { nombreNormalizado } });
    if (exists) {
      throw new ConflictException('El rol ya existe');
    }

    return this.prisma.rol.create({
      data: {
        nombre,
        nombreNormalizado,
        permisos: dto?.permisos || null,
      },
    });
  }

  async update(id: string, dto: UpdateRolDto) {
    await this.findOne(id);

    const nombre = (dto?.nombre || '').trim();
    const nombreNormalizado = nombre ? normalizeRoleName(nombre) : undefined;

    if (nombreNormalizado) {
      const existing = await this.prisma.rol.findFirst({
        where: { nombreNormalizado, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Ya existe otro rol con ese nombre');
      }
    }

    return this.prisma.rol.update({
      where: { id },
      data: {
        ...(nombre ? { nombre, nombreNormalizado } : {}),
        ...(dto?.permisos !== undefined ? { permisos: dto.permisos } : {}),
      },
      include: {
        usuarios: {
          include: { usuario: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.usuarioRol.deleteMany({
      where: { rolId: id },
    });
    return this.prisma.rol.delete({
      where: { id },
    });
  }
}
