'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Documentos adjuntos</h5>
        <small className="text-muted">PDF · máx. 10 MB</small>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        <div className="row g-3 align-items-end mb-3">
          <div className="col-md-5">
            <label className="form-label small text-muted">
              Tipo de documento
            </label>
            <select
              className="form-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={uploading}
            >
              {TIPO_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-7">
            <div
              className={`border rounded p-3 text-center ${dragging ? 'bg-light' : ''}`}
              style={{
                borderStyle: 'dashed',
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
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
                className="d-none"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadFile(file);
                }}
              />
              {uploading ? (
                <span>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  />
                  Subiendo…
                </span>
              ) : (
                <span className="text-muted">
                  <i className="ti ti-cloud-upload me-1"></i>
                  Arrastra un PDF aquí o haz clic para seleccionarlo
                </span>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-muted text-center py-3">Cargando documentos…</div>
        ) : docs.length === 0 ? (
          <div className="text-muted text-center py-3">
            Aún no hay documentos adjuntos a este contrato.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Tipo</th>
                  <th>Peso</th>
                  <th>Subido</th>
                  <th>Por</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <i className="ti ti-file-type-pdf text-danger me-1"></i>
                      <span className="fw-semibold">{d.nombreOriginal}</span>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary">
                        {tipoLabel(d.tipo)}
                      </span>
                    </td>
                    <td>{formatBytes(d.tamanioBytes)}</td>
                    <td>{formatDate(d.fechaCreacion)}</td>
                    <td>
                      {d.subidoPor
                        ? `${d.subidoPor.nombre} ${d.subidoPor.apellido}`
                        : '-'}
                    </td>
                    <td className="text-end">
                      <a
                        href={`/api/contratos/${contratoId}/documentos/${d.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-primary me-1"
                        title="Abrir"
                      >
                        <i className="ti ti-eye"></i>
                      </a>
                      <a
                        href={`/api/contratos/${contratoId}/documentos/${d.id}/file`}
                        download={d.nombreOriginal}
                        className="btn btn-sm btn-outline-primary me-1"
                        title="Descargar"
                      >
                        <i className="ti ti-download"></i>
                      </a>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={deletingId === d.id}
                        onClick={() => deleteDoc(d.id)}
                        title="Eliminar"
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
