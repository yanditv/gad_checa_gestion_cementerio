import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Servicio de correo basado en nodemailer.
 *
 * Configuración por env:
 *   SMTP_HOST     (default: localhost)
 *   SMTP_PORT     (default: 1025 — MailHog)
 *   SMTP_USER     (opcional)
 *   SMTP_PASS     (opcional)
 *   SMTP_SECURE   (default: false)
 *   SMTP_FROM     (default: no-reply@gadcheca.gob.ec)
 *
 * Si SMTP_HOST no está definido, el servicio entra en modo "log only":
 * registra el contenido del correo y devuelve éxito sin enviar nada. Útil
 * para entornos sin SMTP donde el flujo de password reset igual debe correr.
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: nodemailer.Transporter;
  private from!: string;
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    this.from =
      this.config.get<string>('SMTP_FROM') || 'no-reply@gadcheca.gob.ec';

    if (!host) {
      this.logger.warn(
        'SMTP_HOST no definido. EmailService en modo log-only (no se envían correos).',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get<string>('SMTP_PORT') ?? 1025),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: this.config.get<string>('SMTP_USER')
        ? {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASS') ?? '',
          }
        : undefined,
    });
    this.enabled = true;
    this.logger.log(`EmailService listo. From=${this.from} Host=${host}`);
  }

  async send(opts: SendMailOptions): Promise<void> {
    if (!this.enabled || !this.transporter) {
      this.logger.log(
        `[LOG-ONLY] Correo no enviado a ${opts.to} — asunto "${opts.subject}":\n${opts.text}`,
      );
      return;
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html ?? opts.text.replace(/\n/g, '<br />'),
      });
      this.logger.log(`Correo enviado a ${opts.to} (id=${info.messageId})`);
    } catch (err) {
      this.logger.error(
        `Fallo al enviar correo a ${opts.to}: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  async sendPasswordReset(
    to: string,
    nombre: string,
    resetUrl: string,
  ): Promise<void> {
    const subject = 'Recuperación de contraseña — Cementerio GAD Checa';
    const text =
      `Hola ${nombre},\n\n` +
      `Recibimos una solicitud para restablecer la contraseña de tu cuenta.\n` +
      `Para crear una nueva contraseña, haz clic en el siguiente enlace ` +
      `(válido por 1 hora):\n\n${resetUrl}\n\n` +
      `Si no solicitaste este cambio, ignora este correo: tu contraseña actual seguirá siendo válida.\n\n` +
      `— Sistema de Gestión de Cementerio GAD Checa`;

    await this.send({ to, subject, text });
  }
}
