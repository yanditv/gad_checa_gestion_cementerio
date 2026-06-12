'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { cn } from './cn';

/** Tipos y tamaño aceptados (paridad con el backend PhotoService). */
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export interface ImageUploadProps {
  /** URL de la imagen ya guardada (modo edición). */
  value?: string | null;
  /**
   * Notifica el cambio: `File` cuando se elige una imagen nueva, `null` cuando
   * se quita. El padre decide cuándo subir/borrar (normalmente al guardar).
   */
  onChange: (file: File | null) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  /** `square` (bienes) o `circle` (avatares/difuntos). */
  shape?: 'square' | 'circle';
  className?: string;
}

/**
 * Carga de imagen opcional con preview, quitar y arrastrar-y-soltar. Validación
 * de tipo/tamaño en cliente (JPG/PNG/WEBP ≤ 5 MB). Tailwind puro, accesible.
 *
 * Es un control "diferido": emite el `File` elegido (o `null` al quitar) y el
 * formulario padre realiza la subida real tras crear/actualizar la entidad.
 */
export function ImageUpload({
  value,
  onChange,
  label,
  hint,
  disabled,
  shape = 'square',
  className,
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Sincroniza con `value` cuando no hay una selección local pendiente.
  useEffect(() => {
    if (!objectUrl) setPreview(value ?? null);
  }, [value, objectUrl]);

  // Libera el object URL al desmontar o reemplazar.
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  function selectFile(file: File | undefined | null) {
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
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setPreview(url);
    onChange(file);
  }

  function clear() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onChange(null);
  }

  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div className="flex items-center gap-4">
        {/* Preview / dropzone */}
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            if (disabled) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            if (disabled) return;
            e.preventDefault();
            setDragging(false);
            selectFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden border-2 border-dashed bg-slate-50 text-slate-400 transition-colors',
            rounded,
            dragging
              ? 'border-primary-400 bg-primary-50 text-primary-500'
              : 'border-slate-300 hover:border-primary-300 hover:text-primary-500',
            disabled && 'cursor-not-allowed opacity-60',
            !disabled && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Vista previa"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-7 w-7" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {preview ? 'Cambiar imagen' : 'Subir imagen'}
          </button>
          {preview && !disabled && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-danger-600 transition-colors hover:text-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Quitar
            </button>
          )}
          {hint && !error && (
            <p className="text-caption text-slate-500">{hint}</p>
          )}
          {error && <p className="text-caption text-danger-600">{error}</p>}
        </div>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => selectFile(e.target.files?.[0])}
      />
    </div>
  );
}
