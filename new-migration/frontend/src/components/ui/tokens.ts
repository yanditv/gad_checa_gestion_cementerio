/**
 * Tipos compartidos de la librería de componentes CRM.
 *
 * Los seis tonos semánticos canónicos (DESIGN.md §3.1) más `neutral` para
 * estados sin carga semántica. Las superficies suaves siguen la convención
 * de pill `bg-{tono}-50 text-{tono}-700 ring-{tono}-200`.
 */
export type Tone =
  | 'primary'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'secondary';

export type ToneOrNeutral = Tone | 'neutral';

export type Size = 'sm' | 'md' | 'lg';
