import { PaginationMeta } from './interfaces/paginated-result.interface';

export function normalizePagination(page?: number, limit?: number) {
  const safePage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
  const skip = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, skip };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

