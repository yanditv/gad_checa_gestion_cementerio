import { type ReactNode } from 'react';
import { cn } from './cn';

export interface CardProps {
  /** Padding del cuerpo cuando se usa el modo simple (sin subcomponentes). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Encabezado rápido (atajo de `Card.Header`). */
  header?: ReactNode;
  /** Pie rápido (atajo de `Card.Footer`). */
  footer?: ReactNode;
  /** Eleva la sombra al hover (tarjeta interactiva/navegable). */
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
}

const paddings: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const surface =
  'rounded-xl border border-slate-200 bg-white shadow-soft';

/**
 * Panel base del CRM: `rounded-xl border-slate-200 bg-white shadow-soft`
 * (DESIGN.md §6.2). Úsalo con `children` directos o con los subcomponentes
 * `Card.Header` / `Card.Body` / `Card.Footer` para estructurar header, cuerpo
 * y pie con separadores finos.
 */
export function Card({
  padding = 'md',
  header,
  footer,
  interactive = false,
  className,
  children,
}: CardProps) {
  const hasSlots = header != null || footer != null;
  return (
    <div
      className={cn(
        surface,
        'overflow-hidden',
        interactive &&
          'transition-shadow duration-150 hover:shadow-md',
        className,
      )}
    >
      {header != null && <CardHeader>{header}</CardHeader>}
      {hasSlots ? (
        <CardBody padding={padding}>{children}</CardBody>
      ) : (
        <div className={paddings[padding]}>{children}</div>
      )}
      {footer != null && <CardFooter>{footer}</CardFooter>}
    </div>
  );
}

export interface CardSectionProps {
  className?: string;
  children: ReactNode;
}

/** Cabecera de tarjeta con separador inferior fino (DESIGN.md §6.2). */
function CardHeader({ className, children }: CardSectionProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface CardBodyProps extends CardSectionProps {
  padding?: NonNullable<CardProps['padding']>;
}

/** Cuerpo de tarjeta. */
function CardBody({ padding = 'md', className, children }: CardBodyProps) {
  return <div className={cn(paddings[padding], className)}>{children}</div>;
}

/** Pie de tarjeta con separador superior fino. */
function CardFooter({ className, children }: CardSectionProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Título estándar de cabecera de tarjeta (DESIGN.md §3.2). */
function CardTitle({
  icon,
  className,
  children,
}: {
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <h3
      className={cn(
        'flex items-center gap-2 text-base font-semibold text-slate-900',
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="inline-flex text-lg text-slate-400">
          {icon}
        </span>
      )}
      {children}
    </h3>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
