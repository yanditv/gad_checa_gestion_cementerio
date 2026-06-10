/**
 * Librería de componentes CRM (Tailwind puro, tipada, accesible).
 * Punto único de importación: `import { Button, Badge } from '@/components/ui'`.
 *
 * Fase 1 — Primitivos. Las fases siguientes añaden compuestos (Card,
 * DataTable, Modal, …) a este mismo barril.
 */

// Utilidades y tipos compartidos
export { cn } from './cn';
export type { Tone, ToneOrNeutral, Size } from './tokens';

// Acciones
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';
export { IconButton } from './IconButton';
export type {
  IconButtonProps,
  IconButtonVariant,
  IconButtonSize,
} from './IconButton';

// Formulario
export { Field, controlBase, controlInvalid } from './Field';
export type { FieldProps } from './Field';
export { Input } from './Input';
export type { InputProps } from './Input';
export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';
export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';
export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';
export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

// Presentación
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize } from './Avatar';

// Estado / feedback
export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';
export { Skeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';
export { Tooltip } from './Tooltip';
export type { TooltipProps, TooltipSide } from './Tooltip';
