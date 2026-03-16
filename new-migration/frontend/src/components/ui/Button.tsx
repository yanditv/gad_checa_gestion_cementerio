import Link from 'next/link';
import React from 'react';

type Variant = 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
  icon?: string;
}

export function Button({ variant = 'primary', href, icon, children, className = '', ...props }: ButtonProps) {
  const classes = `btn btn-${variant} ${className}`.trim();
  const content = (
    <>
      {icon ? <i className={`ti ${icon} me-1`}></i> : null}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
}

