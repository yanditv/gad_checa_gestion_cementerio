import { clsx, type ClassValue } from 'clsx';

/**
 * Une clases condicionales con `clsx`. Punto único de entrada para que los
 * componentes de la librería compongan utilidades Tailwind sin repetir lógica.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
