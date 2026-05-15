import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificacionJob {
  private readonly logger = new Logger(NotificacionJob.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Diario a las 7:00 AM (America/Guayaquil = UTC-5).
   * Genera notificaciones para:
   *   - Contratos que vencen en los próximos 30 días (inclusive hoy).
   *   - Cuotas vencidas y no pagadas.
   *
   * Idempotente: verifica existencia previa con mismo tipo + entidadTipo +
   * entidadId + usuarioId antes de insertar. Si el servidor no corre un día,
   * la ventana amplia (≥ hoy) recupera los contratos pendientes.
   */
  @Cron('0 7 * * *', { timeZone: 'America/Guayaquil' })
  async handleDailyNotifications() {
    this.logger.log('Iniciando job diario de notificaciones');

    // Carga única de administradores activos antes de los bucles (evita N+1).
    const admins = await this.getAdmins();

    try {
      await this.notifyContratosPorVencer(admins);
    } catch (err) {
      this.logger.error(
        `Error en notifyContratosPorVencer: ${(err as Error).message}`,
      );
    }

    try {
      await this.notifyCuotasVencidas(admins);
    } catch (err) {
      this.logger.error(
        `Error en notifyCuotasVencidas: ${(err as Error).message}`,
      );
    }

    this.logger.log('Job diario de notificaciones completado');
  }

  private async notifyContratosPorVencer(admins: { id: string }[]) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en30Dias = new Date(hoy);
    en30Dias.setDate(en30Dias.getDate() + 30);
    en30Dias.setHours(23, 59, 59, 999);

    const contratos = await this.prisma.contrato.findMany({
      where: {
        estado: true,
        fechaFin: {
          gte: hoy,
          lte: en30Dias,
        },
      },
      include: {
        difunto: { select: { nombre: true, apellido: true } },
        boveda: {
          select: {
            numero: true,
            bloque: { select: { nombre: true } },
          },
        },
      },
    });

    let creadas = 0;
    for (const c of contratos) {
      for (const u of admins) {
        const existe = await this.prisma.notificacion.findFirst({
          where: {
            tipo: 'ContratoPorVencer',
            entidadTipo: 'Contrato',
            entidadId: c.id,
            usuarioId: u.id,
          },
        });
        if (existe) continue;

        const difuntoNombre =
          [c.difunto?.nombre, c.difunto?.apellido].filter(Boolean).join(' ') ||
          'N/A';
        await this.prisma.notificacion.create({
          data: {
            tipo: 'ContratoPorVencer',
            titulo: 'Contrato por vencer',
            mensaje:
              `El contrato ${c.numeroSecuencial} (${difuntoNombre}, ` +
              `bóveda ${c.boveda?.numero ?? 'N/A'} / ${c.boveda?.bloque?.nombre ?? 'N/A'}) ` +
              `vence el ${c.fechaFin ? new Date(c.fechaFin).toLocaleDateString('es-EC') : 'N/A'}.`,
            usuarioId: u.id,
            entidadTipo: 'Contrato',
            entidadId: c.id,
          },
        });
        creadas += 1;
      }
    }

    if (creadas > 0) {
      this.logger.log(`Generadas ${creadas} notificaciones de contratos por vencer`);
    }
  }

  private async notifyCuotasVencidas(admins: { id: string }[]) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const cuotas = await this.prisma.cuota.findMany({
      where: {
        estado: true,
        pagada: false,
        fechaVencimiento: { lt: hoy },
      },
      include: {
        contrato: {
          select: {
            numeroSecuencial: true,
            difunto: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });

    let creadas = 0;
    for (const c of cuotas) {
      for (const u of admins) {
        const existe = await this.prisma.notificacion.findFirst({
          where: {
            tipo: 'CuotaVencida',
            entidadTipo: 'Cuota',
            entidadId: c.id,
            usuarioId: u.id,
          },
        });
        if (existe) continue;

        const difuntoNombre =
          [c.contrato?.difunto?.nombre, c.contrato?.difunto?.apellido]
            .filter(Boolean)
            .join(' ') || 'N/A';
        await this.prisma.notificacion.create({
          data: {
            tipo: 'CuotaVencida',
            titulo: 'Cuota vencida',
            mensaje:
              `La cuota #${c.numero} del contrato ${c.contrato?.numeroSecuencial ?? 'N/A'} ` +
              `(${difuntoNombre}) venció el ${new Date(c.fechaVencimiento).toLocaleDateString('es-EC')} ` +
              `y no ha sido pagada.`,
            usuarioId: u.id,
            entidadTipo: 'Cuota',
            entidadId: c.id,
          },
        });
        creadas += 1;
      }
    }

    if (creadas > 0) {
      this.logger.log(`Generadas ${creadas} notificaciones de cuotas vencidas`);
    }
  }

  /**
   * Obtiene los usuarios con rol Administrador activos para notificar.
   * En una fase posterior se puede refinar para notificar al responsable
   * directo del contrato (requiere mapeo Persona ↔ Usuario).
   */
  private async getAdmins() {
    return this.prisma.usuario.findMany({
      where: {
        estado: true,
        usuarioRols: {
          some: {
            rol: {
              nombreNormalizado: 'administrador',
            },
          },
        },
      },
      select: { id: true },
    });
  }
}
