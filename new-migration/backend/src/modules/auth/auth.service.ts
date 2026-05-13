import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/email/email.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

interface AccessPayload {
  sub: string;
  email: string;
  purpose: 'access';
}

interface ResetPayload {
  sub: string;
  purpose: 'password-reset';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // ---------------------------------------------------------------------------
  // Registro y login
  // ---------------------------------------------------------------------------

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { numeroIdentificacion: dto.numeroIdentificacion },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        numeroIdentificacion: dto.numeroIdentificacion,
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        passwordHash,
        telefono: dto.telefono,
        direccion: dto.direccion,
        tipoIdentificacion: dto.tipoIdentificacion || 'CED',
      },
    });

    // Asigna rol 'Usuario' por defecto (paridad legado: rol no privilegiado).
    const rolUsuario = await this.prisma.rol.findUnique({
      where: { nombre: 'Usuario' },
    });
    if (rolUsuario) {
      await this.prisma.usuarioRol.create({
        data: { usuarioId: usuario.id, rolId: rolUsuario.id },
      });
    }

    return this.buildSession(usuario.id);
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!usuario || !usuario.estado) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      usuario.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildSession(usuario.id);
  }

  /**
   * El cliente borra el JWT; el backend no mantiene blacklist por simplicidad
   * (la sesión expira por TTL). Devolvemos 200 para que la UI complete el
   * cierre limpiamente.
   */
  logout() {
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Recuperación de contraseña
  // ---------------------------------------------------------------------------

  /**
   * Genera un token JWT con propósito `password-reset` (TTL 1h) y envía el
   * enlace al correo del usuario. **No revela** si el correo existe o no:
   * siempre devuelve éxito para evitar enumeración de usuarios.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (usuario && usuario.estado) {
      const payload: ResetPayload = {
        sub: usuario.id,
        purpose: 'password-reset',
      };
      const resetTtl =
        this.config.get<string>('JWT_RESET_EXPIRES_IN') ?? '1h';
      const token = this.jwtService.sign(payload, {
        // Cast: la firma de jsonwebtoken tipa expiresIn como literal type,
        // pero acepta cualquier string parseable por `ms` (ej. "1h", "30m").
        expiresIn: resetTtl as unknown as number,
      });
      const frontUrl =
        this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
      const resetUrl = `${frontUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

      try {
        await this.emailService.sendPasswordReset(
          usuario.email,
          usuario.nombre,
          resetUrl,
        );
      } catch (err) {
        // Log y sigue (no exponer fallo SMTP al cliente).
        this.logger.error(
          `Fallo envío reset password: ${(err as Error).message}`,
        );
      }
    }

    return {
      success: true,
      message:
        'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: ResetPayload;
    try {
      payload = this.jwtService.verify<ResetPayload>(dto.token);
    } catch {
      throw new BadRequestException('El enlace es inválido o expiró');
    }
    if (payload.purpose !== 'password-reset') {
      throw new BadRequestException('El enlace es inválido');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });
    if (!usuario || !usuario.estado) {
      throw new BadRequestException('El enlace es inválido o expiró');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        fechaActualizacion: new Date(),
      },
    });

    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const valid = await bcrypt.compare(
      dto.currentPassword,
      usuario.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        fechaActualizacion: new Date(),
      },
    });

    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Perfil
  // ---------------------------------------------------------------------------

  async getProfile(userId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { usuarioRols: { include: { rol: true } } },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      tipoIdentificacion: usuario.tipoIdentificacion,
      numeroIdentificacion: usuario.numeroIdentificacion,
      mustChangePassword: usuario.mustChangePassword,
      roles: usuario.usuarioRols.map((ur) => ur.rol.nombre),
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async buildSession(userId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { usuarioRols: { include: { rol: true } } },
    });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const payload: AccessPayload = {
      sub: usuario.id,
      email: usuario.email,
      purpose: 'access',
    };
    const token = this.jwtService.sign(payload);

    return {
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        mustChangePassword: usuario.mustChangePassword,
        roles: usuario.usuarioRols.map((ur) => ur.rol.nombre),
      },
      token,
    };
  }
}
