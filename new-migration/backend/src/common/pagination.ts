import { PaginationMeta } from './interfaces/paginated-result.interface';

export function normalizePagination(page?: number | string, limit?: number | string) {
  const numPage = typeof page === 'string' ? Number(page) : page;
  const numLimit = typeof limit === 'string' ? Number(limit) : limit;
  const safePage = Number.isFinite(numPage) && numPage && numPage > 0 ? Math.floor(numPage) : 1;
  const safeLimit = Number.isFinite(numLimit) && numLimit && numLimit > 0 ? Math.min(Math.floor(numLimit), 100) : 15;
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

