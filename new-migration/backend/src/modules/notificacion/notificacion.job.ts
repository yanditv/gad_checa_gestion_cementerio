import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificacionService } from './notificacion.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificacionJob {
  private readonly logger = new Logger(NotificacionJob.name);

  constructor(
    private prisma: PrismaService,
    private notifService: NotificacionService,
  ) {}

  /**
   * Diario a las 7:00 AM (America/Guayaquil = UTC-5).
   * Genera notificaciones para:
   *   - Contratos que vencen en exactamente 30 días.
   *   - Cuotas vencidas y no pagadas.
   */
  @Cron('0 7 * * *', { timeZone: 'America/Guayaquil' })
  async handleDailyNotifications() {
    this.logger.log('Iniciando job diario de notificaciones');
    await this.notifyContratosPorVencer();
    await this.notifyCuotasVencidas();
    this.logger.log('Job diario de notificaciones completado');
  }

  private async notifyContratosPorVencer() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en30Dias = new Date(hoy);
    en30Dias.setDate(en30Dias.getDate() + 30);

    const contratos = await this.prisma.contrato.findMany({
      where: {
        estado: true,
        fechaFin: {
          gte: en30Dias,
          lt: new Date(en30Dias.getTime() + 24 * 60 * 60 * 1000),
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

    for (const c of contratos) {
      const usuarios = await this.getUsuariosANotificar();
      for (const u of usuarios) {
        const difuntoNombre =
          [c.difunto?.nombre, c.difunto?.apellido].filter(Boolean).join(' ') ||
          'N/A';
        await this.notifService.create({
          tipo: 'ContratoPorVencer',
          titulo: 'Contrato por vencer',
          mensaje:
            `El contrato ${c.numeroSecuencial} (${difuntoNombre}, ` +
            `bóveda ${c.boveda?.numero ?? 'N/A'} / ${c.boveda?.bloque?.nombre ?? 'N/A'}) ` +
            `vence el ${c.fechaFin ? new Date(c.fechaFin).toLocaleDateString('es-EC') : 'N/A'}.`,
          usuarioId: u.id,
          entidadTipo: 'Contrato',
          entidadId: c.id,
        });
      }
    }

    if (contratos.length > 0) {
      this.logger.log(
        `Generadas notificaciones para ${contratos.length} contratos por vencer`,
      );
    }
  }

  private async notifyCuotasVencidas() {
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

    for (const c of cuotas) {
      const usuarios = await this.getUsuariosANotificar();
      for (const u of usuarios) {
        const difuntoNombre =
          [c.contrato?.difunto?.nombre, c.contrato?.difunto?.apellido]
            .filter(Boolean)
            .join(' ') || 'N/A';
        await this.notifService.create({
          tipo: 'CuotaVencida',
          titulo: 'Cuota vencida',
          mensaje:
            `La cuota #${c.numero} del contrato ${c.contrato?.numeroSecuencial ?? 'N/A'} ` +
            `(${difuntoNombre}) venció el ${new Date(c.fechaVencimiento).toLocaleDateString('es-EC')} ` +
            `y no ha sido pagada.`,
          usuarioId: u.id,
          entidadTipo: 'Cuota',
          entidadId: c.id,
        });
      }
    }

    if (cuotas.length > 0) {
      this.logger.log(
        `Generadas notificaciones para ${cuotas.length} cuotas vencidas`,
      );
    }
  }

  /**
   * Obtiene los usuarios con rol Administrador o Admin para notificar.
   * En una fase posterior se puede refinar para notificar al responsable
   * directo del contrato (requiere mapeo Persona ↔ Usuario).
   */
  private async getUsuariosANotificar() {
    return this.prisma.usuario.findMany({
      where: {
        estado: true,
        usuarioRols: {
          some: {
            rol: {
              nombreNormalizado: {
                in: ['administrador', 'admin'],
              },
            },
          },
        },
      },
      select: { id: true },
    });
  }
}
