import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restringe el handler a usuarios que tengan al menos uno de los roles indicados.
 * Compatible con los tres roles legados: 'Admin' | 'Usuario' | 'Administrador'.
 *
 *   @Roles('Administrador')
 *   @Roles('Admin', 'Administrador')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
