/**
 * Persistencia local de wizards multi-paso.
 *
 * Sustituye al `HttpContext.Session` del legado: el estado del wizard se
 * guarda en `localStorage` con una clave versionada y un TTL de 4 horas.
 *
 * Si el shape del wizard cambia, **incrementar la versión** en la clave
 * para invalidar los borradores guardados con la forma anterior.
 *
 *   loadWizard('contrato:v1')   → null si no hay o expiró
 *   saveWizard('contrato:v1', state)
 *   clearWizard('contrato:v1')
 */

const PREFIX = 'cementerio:wizard';
export const WIZARD_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

interface Envelope<T> {
  v: number;
  savedAt: number;
  data: T;
}

function fullKey(key: string): string {
  return `${PREFIX}:${key}`;
}

export function loadWizard<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(fullKey(key));
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope<T>;
    if (!env || typeof env.savedAt !== 'number') return null;
    if (Date.now() - env.savedAt > WIZARD_TTL_MS) {
      window.localStorage.removeItem(fullKey(key));
      return null;
    }
    return env.data;
  } catch {
    return null;
  }
}

export function saveWizard<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const env: Envelope<T> = { v: 1, savedAt: Date.now(), data };
    window.localStorage.setItem(fullKey(key), JSON.stringify(env));
  } catch {
    /* quota o modo privado: aceptamos la degradación silenciosa */
  }
}

export function clearWizard(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(fullKey(key));
}
