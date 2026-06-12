'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload, Trash2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { authApi } from '@/lib/api';
import { cn } from './cn';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export interface AvatarUploadProps {
  /** URL actual del avatar (puede ser null). */
  src?: string | null;
  /** Nombre para iniciales de respaldo y `alt`. */
  name?: string;
  /** Se invoca tras subir o quitar; recibe la `avatarUrl` resultante. */
  onChange?: (avatarUrl: string | null) => void;
  className?: string;
}

/**
 * Carga del avatar de la cuenta propia. A diferencia de `ImageUpload`, sube de
 * inmediato (la cuenta ya existe) vía `authApi` y notifica la nueva `avatarUrl`
 * para refrescar el topbar. Añade un cache-buster para forzar el re-render.
 */
export function AvatarUpload({ src, name, onChange, className }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const displaySrc = src ? `${src}?v=${version}` : null;

  async function onSelect(file: File | undefined | null) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError('Formato no permitido. Usa JPG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('La imagen supera el límite de 5 MB.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const updated = await authApi.uploadAvatar(file);
      setVersion((v) => v + 1);
      onChange?.(updated?.avatarUrl ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir el avatar');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove() {
    setError(null);
    setBusy(true);
    try {
      await authApi.deleteAvatar();
      setVersion((v) => v + 1);
      onChange?.(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar el avatar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative">
        <Avatar src={displaySrc} name={name} size="lg" className="h-16 w-16 text-lg" />
        {busy && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-white/60">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {src ? 'Cambiar foto' : 'Subir foto'}
          </button>
          {src && (
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-danger-600 transition-colors hover:text-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Quitar
            </button>
          )}
        </div>
        {error ? (
          <p className="text-caption text-danger-600">{error}</p>
        ) : (
          <p className="text-caption text-slate-500">JPG, PNG o WEBP, máx. 5 MB.</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(e) => onSelect(e.target.files?.[0])}
      />
    </div>
  );
}
