import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  purpose?: 'access' | 'password-reset';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET') || 'cementerio-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // Tokens con propósito password-reset no sirven para acceder a APIs protegidas.
    if (payload.purpose && payload.purpose !== 'access') {
      throw new UnauthorizedException('Token no válido para acceso');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: { usuarioRols: { include: { rol: true } } },
    });

    if (!usuario || !usuario.estado) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      roles: usuario.usuarioRols.map((ur) => ur.rol.nombre),
      mustChangePassword: usuario.mustChangePassword,
    };
  }
}
