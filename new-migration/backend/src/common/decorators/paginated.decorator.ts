import { SetMetadata, applyDecorators } from '@nestjs/common';

/**
 * Marca un endpoint como paginado.
 *
 * El `ApiResponseInterceptor` global detecta respuestas paginadas por
 * estructura (`items` + `meta`), pero este decorador las hace explícitas
 * en el código y permite futuras mejoras (p.ej. Swagger con
 * `@ApiResponse({ type: PaginatedDto<T> })`).
 */
export const PAGINATED_KEY = 'paginated';

export function Paginated() {
  return applyDecorators(SetMetadata(PAGINATED_KEY, true));
}
