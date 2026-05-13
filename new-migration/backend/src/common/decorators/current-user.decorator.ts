import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  roles: string[];
  mustChangePassword: boolean;
}

/**
 * Inyecta el usuario autenticado (resuelto por JwtStrategy) en el handler.
 *
 *   findAll(@CurrentUser() user: AuthUser) { ... }
 *   findAll(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (key: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;
    if (!user) return undefined;
    return key ? user[key] : user;
  },
);
