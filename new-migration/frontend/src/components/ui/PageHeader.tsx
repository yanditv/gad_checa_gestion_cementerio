import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>{title}</h2>
          {subtitle ? <p className="text-muted mb-0 small">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
    </div>
  );
}

