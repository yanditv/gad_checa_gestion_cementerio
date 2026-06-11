'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CloudUpload,
  Download,
  Eye,
  FileText,
  FileX,
  Loader2,
  Trash2,
} from 'lucide-react';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME = 'application/pdf';

const TIPO_OPTIONS = [
  { value: 'ContratoFirmado', label: 'Contrato firmado' },
  { value: 'CedulaResponsable', label: 'Cédula del responsable' },
  { value: 'CertificadoDefuncion', label: 'Certificado de defunción' },
  { value: 'Otro', label: 'Otro' },
];

interface Documento {
  id: number;
  nombreOriginal: string;
  tipo: string;
  mimeType: string;
  tamanioBytes: number;
  fechaCreacion: string;
  subidoPor?: { nombre: string; apellido: string } | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '-'
    : d.toLocaleString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function tipoLabel(tipo: string): string {
  return TIPO_OPTIONS.find((t) => t.value === tipo)?.label ?? tipo;
}

export function DocumentosSection({ contratoId }: { contratoId: number }) {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('ContratoFirmado');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contratos/${contratoId}/documentos`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('No se pudieron cargar los documentos');
      const payload = await res.json();
      setDocs(Array.isArray(payload) ? payload : payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [contratoId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function uploadFile(file: File) {
    setError(null);

    if (file.type !== ACCEPTED_MIME) {
      setError('Solo se permiten archivos PDF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('El archivo supera el límite de 10 MB.');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('tipo', tipo);
      const res = await fetch(`/api/contratos/${contratoId}/documentos`, {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || 'No se pudo subir el archivo');
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function deleteDoc(docId: number) {
    if (!window.confirm('¿Eliminar este documento?')) return;
    setDeletingId(docId);
    setError(null);
    try {
      const res = await fetch(
        `/api/contratos/${contratoId}/documentos/${docId}`,
        { method: 'DELETE', credentials: 'same-origin' },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || 'No se pudo eliminar');
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setDeletingId(null);
    }
  }

  const columns: DataTableColumn<Documento>[] = [
    {
      key: 'documento',
      header: 'Documento',
      sortable: true,
      sortValue: (d) => d.nombreOriginal,
      cell: (d) => (
        <span className="inline-flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-500" strokeWidth={2} aria-hidden="true" />
          <span className="font-medium text-slate-700">{d.nombreOriginal}</span>
        </span>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      sortable: true,
      sortValue: (d) => tipoLabel(d.tipo),
      cell: (d) => (
        <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
          {tipoLabel(d.tipo)}
        </span>
      ),
    },
    {
      key: 'peso',
      header: 'Peso',
      sortable: true,
      sortValue: (d) => d.tamanioBytes,
      cell: (d) => (
        <span className="text-slate-600">{formatBytes(d.tamanioBytes)}</span>
      ),
    },
    {
      key: 'subido',
      header: 'Subido',
      sortable: true,
      sortValue: (d) => d.fechaCreacion,
      cell: (d) => (
        <span className="text-slate-500">{formatDate(d.fechaCreacion)}</span>
      ),
    },
    {
      key: 'por',
      header: 'Por',
      sortable: true,
      sortValue: (d) =>
        d.subidoPor ? `${d.subidoPor.nombre} ${d.subidoPor.apellido}` : null,
      cell: (d) => (
        <span className="text-slate-600">
          {d.subidoPor
            ? `${d.subidoPor.nombre} ${d.subidoPor.apellido}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cell: (d) => (
        <div className="inline-flex items-center gap-1">
          <a
            href={`/api/contratos/${contratoId}/documentos/${d.id}/file`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
            title="Abrir"
          >
            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </a>
          <a
            href={`/api/contratos/${contratoId}/documentos/${d.id}/file`}
            download={d.nombreOriginal}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
            title="Descargar"
          >
            <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </a>
          <button
            type="button"
            disabled={deletingId === d.id}
            onClick={() => deleteDoc(d.id)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Documentos adjuntos
        </h3>
        <span className="text-xs text-slate-400">PDF · máx. 10 MB</span>
      </header>

      <div className="p-5">
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-4">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Tipo de documento
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={uploading}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:bg-slate-50 disabled:opacity-70"
            >
              {TIPO_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-8">
            <div
              className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                dragging
                  ? 'border-primary-500 bg-primary-50/50'
                  : 'border-slate-200 bg-slate-50/40'
              } ${uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-50'}`}
              onClick={() => !uploading && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!uploading) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (uploading) return;
                const file = e.dataTransfer.files?.[0];
                if (file) void uploadFile(file);
              }}
              role="button"
              tabIndex={0}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadFile(file);
                }}
              />
              {uploading ? (
                <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <Loader2
                    className="h-4 w-4 animate-spin text-primary-500"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Subiendo…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <CloudUpload
                    className="h-5 w-5 text-primary-500"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Arrastra un PDF aquí o haz clic para seleccionarlo
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={docs}
            rowKey={(d) => d.id}
            loading={loading}
            skeletonRows={3}
            empty={
              <EmptyState
                icon={<FileX className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />}
                title="Aún no hay documentos adjuntos a este contrato."
                compact
              />
            }
          />
        </div>
      </div>
    </section>
  );
}
