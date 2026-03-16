import React from 'react';

interface SearchFiltersProps {
  children: React.ReactNode;
}

export function SearchFilters({ children }: SearchFiltersProps) {
  return (
    <div className="card-header">
      <div className="d-flex gap-3 flex-wrap align-items-center">{children}</div>
    </div>
  );
}

