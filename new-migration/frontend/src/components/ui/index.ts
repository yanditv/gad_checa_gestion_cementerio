/**
 * Librería de componentes CRM (Tailwind puro, tipada, accesible).
 * Punto único de importación: `import { Button, Badge } from '@/components/ui'`.
 *
 * Fase 1 — Primitivos. Fase 2 — Compuestos (Card, PageHeader, DataTable,
 * Pagination, Modal, DropdownMenu, Tabs, EmptyState, Toast, SearchFilters,
 * FormSection, StatusPill).
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
export { DatePicker } from './DatePicker';
export type { DatePickerProps } from './DatePicker';
export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';
export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

// Presentación
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize } from './Avatar';
export { ImageUpload } from './ImageUpload';
export type { ImageUploadProps } from './ImageUpload';
export { AvatarUpload } from './AvatarUpload';
export type { AvatarUploadProps } from './AvatarUpload';

// Estado / feedback
export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';
export { Skeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';
export { Tooltip } from './Tooltip';
export type { TooltipProps, TooltipSide } from './Tooltip';

// ─── Fase 2 · Compuestos ────────────────────────────────────────────────

// Superficies y estructura
export { Card } from './Card';
export type { CardProps, CardSectionProps, CardBodyProps } from './Card';
export { PageHeader } from './PageHeader';
export type { PageHeaderProps } from './PageHeader';
export { FormSection } from './FormSection';
export type { FormSectionProps } from './FormSection';

// Listados
export { DataTable } from './DataTable';
export type {
  DataTableProps,
  DataTableColumn,
  DataTableSort,
  SortDirection,
} from './DataTable';
export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';
export { SearchFilters } from './SearchFilters';
export type { SearchFiltersProps } from './SearchFilters';

// Overlays e interacción
export { Modal } from './Modal';
export type { ModalProps, ModalSize } from './Modal';
export { DropdownMenu } from './DropdownMenu';
export type { DropdownMenuProps, DropdownMenuItem } from './DropdownMenu';
export { Tabs } from './Tabs';
export type { TabsProps, TabItem } from './Tabs';

// Estado / feedback
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
export { ToastProvider, useToast } from './Toast';
export type { ToastOptions, ToastTone } from './Toast';
export { StatusPill } from './StatusPill';
export type { StatusPillProps } from './StatusPill';
