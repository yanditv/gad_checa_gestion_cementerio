import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un controller o handler como público (omite JwtAuthGuard global).
 * Útil para login, register, forgot-password, reset-password, health.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
