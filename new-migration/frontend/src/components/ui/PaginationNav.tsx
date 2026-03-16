import React from 'react';
import { PaginationMeta } from '@/lib/api';

interface PaginationNavProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationNav({ meta, onPageChange }: PaginationNavProps) {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, hasNextPage, hasPrevPage } = meta;
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="d-flex justify-content-between align-items-center p-3 border-top">
      <small className="text-muted">
        Página {meta.page} de {meta.totalPages} - Total: {meta.total}
      </small>
      <div className="btn-group">
        <button className="btn btn-sm btn-outline-secondary" disabled={!hasPrevPage} onClick={() => onPageChange(page - 1)}>
          Anterior
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button className="btn btn-sm btn-outline-secondary" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}

