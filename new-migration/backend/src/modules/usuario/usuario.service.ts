import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';
import { EmailService } from '../../common/email/email.service';
import { UpdateUsuarioDto } from './dto/request/update-usuario.dto';

/**
 * Email del super-administrador. Este usuario no se puede desactivar ni
 * eliminar (regla descrita en `MIGRATION_PLAN.md` Fase 7.4). Es la cuenta
 * semilla del sistema; perderla dejaría el sistema sin acceso administrativo.
 *
 * Nota sobre auditoría: el modelo `Usuario` no expone los campos
 * `usuarioActualizadorId` / `usuarioEliminadorId` (revisar `schema.prisma`).
 * Por eso `resetPassword` y `remove` no registran al admin que ejecutó la
 * acción más allá del log de aplicación. Si se requiere trazabilidad
 * granular, extender el modelo en una fase posterior.
 */
const SUPER_ADMIN_EMAIL = 'admin@teobu.com';

@Injectable()
export class UsuarioService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { numeroIdentificacion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        include: {
          usuarioRols: {
            include: { rol: true },
          },
        },
        omit: {
          passwordHash: true,
        },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        usuarioRols: {
          include: { rol: true },
        },
      },
      omit: {
        passwordHash: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async update(id: string, data: UpdateUsuarioDto) {
    const usuario = await this.findOne(id);

    const { id: _, passwordHash, ...safeData } = data || {};

    // Bloqueo de identidad del super-admin: no permitir que se cambie su
    // email (perdería su privilegio implícito) ni que se desactive vía
    // update directo. Otros campos (nombre, apellido, teléfono) sí se
    // permiten para mantenimiento básico.
    const isSuperAdmin =
      usuario.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    if (isSuperAdmin) {
      if (safeData.email && safeData.email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
        throw new ForbiddenException(
          'No se puede cambiar el correo del super-administrador',
        );
      }
      if (safeData.estado === false) {
        throw new ForbiddenException(
          'No se puede desactivar al super-administrador del sistema',
        );
      }
    }

    return this.prisma.usuario.update({
      where: { id },
      data: safeData,
      include: {
        usuarioRols: {
          include: { rol: true },
        },
      },
      omit: {
        passwordHash: true,
      },
    });
  }

  async updateEstado(id: string, estado: boolean) {
    const usuario = await this.findOne(id);
    if (
      !estado &&
      usuario.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    ) {
      throw new ForbiddenException(
        'No se puede desactivar al super-administrador del sistema',
      );
    }
    return this.prisma.usuario.update({
      where: { id },
      data: { estado },
      omit: {
        passwordHash: true,
      },
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

  /**
   * Reset administrativo de contraseña. Genera una temporal segura,
   * la guarda hasheada, marca `mustChangePassword=true` y opcionalmente
   * la envía por email. La devuelve sólo en la respuesta si la entrega
   * es manual (no email).
   */
  async resetPassword(
    targetUserId: string,
    options: { notifyByEmail?: boolean } = {},
  ) {
    const usuario = await this.findOne(targetUserId);

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        passwordHash,
        mustChangePassword: true,
        fechaActualizacion: new Date(),
      },
    });

    const notify = options.notifyByEmail !== false;
    let emailSent = false;
    if (notify && usuario.email) {
      try {
        await this.email.send({
          to: usuario.email,
          subject: 'Contraseña temporal — Cementerio GAD Checa',
          text:
            `Hola ${usuario.nombre},\n\n` +
            `Un administrador ha restablecido tu contraseña. Tu contraseña ` +
            `temporal es:\n\n    ${tempPassword}\n\n` +
            `Al iniciar sesión se te pedirá cambiarla por una nueva.\n\n` +
            `— Sistema de Gestión de Cementerio GAD Checa`,
        });
        emailSent = true;
      } catch {
        emailSent = false;
      }
    }

    return {
      success: true,
      emailSent,
      // La temporal sólo se devuelve si el correo no se envió (modo manual).
      tempPassword: emailSent ? null : tempPassword,
    };
  }

  /**
   * Eliminación lógica con bloqueo del super-admin. Se invoca desde
   * `DELETE /usuarios/:id` (Fase 7.4).
   */
  async remove(id: string, adminUserId: string) {
    const usuario = await this.findOne(id);
    if (usuario.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new ForbiddenException(
        'No se puede eliminar al super-administrador del sistema',
      );
    }
    if (usuario.id === adminUserId) {
      throw new BadRequestException(
        'No puedes eliminarte a ti mismo',
      );
    }
    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado: false,
        fechaActualizacion: new Date(),
      },
    });
  }
}

function generateTempPassword(length = 12): string {
  // Alfabeto sin caracteres ambiguos (0/O, 1/l/I) para minimizar errores
  // de transcripción cuando la temporal se entrega manualmente.
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}
