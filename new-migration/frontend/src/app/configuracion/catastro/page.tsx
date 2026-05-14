'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface CatastroImport {
  id: number;
  filename: string;
  estado: 'EN_PROGRESO' | 'COMPLETADO' | 'ERROR';
  registrosProcesados: number;
  bloquesCreados: number;
  bovedasCreadas: number;
  contratosCreados: number;
  errores: string | null;
  mensajeError: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  adminUser?: { nombre: string; apellido: string; email: string };
}

interface ImportResult {
  importId: number;
  estado: string;
  registrosProcesados: number;
  bloquesCreados: number;
  bovedasCreadas: number;
  contratosCreados: number;
  errores: { fila: number; sheet: string; mensaje: string }[];
}

function formatDateTime(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-EC');
}

const ESTADO_TONE: Record<string, string> = {
  EN_PROGRESO: 'bg-amber-50 text-amber-700 ring-amber-200',
  COMPLETADO: 'bg-green-50 text-green-700 ring-green-200',
  ERROR: 'bg-red-50 text-red-700 ring-red-200',
};

export default function CatastroImportPage() {
  const [history, setHistory] = useState<CatastroImport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/catastro/imports?limit=20', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        throw new Error('No se pudo cargar el historial de importaciones');
      }
      const payload = await res.json();
      setHistory((payload?.data ?? []) as CatastroImport[]);
    } catch (err: any) {
      setError(err.message || 'Error cargando historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFileSelected = async (file: File) => {
    setError('');
    setResult(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/catastro/import', {
        method: 'POST',
        credentials: 'same-origin',
        body: fd,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'Error al importar el catastro');
      }
      const payload = await res.json();
      setResult((payload?.data ?? payload) as ImportResult);
      await loadHistory();
    } catch (err: any) {
      setError(err.message || 'Error al importar');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Importación de catastro
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Subir Excel del catastro para actualizar bloques, bóvedas, difuntos
            y contratos. Solo upsert: nunca borra datos existentes.
          </p>
        </div>
        <Link
          href="/configuracion"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Subir nuevo Excel
          </h2>
        </header>
        <div className="space-y-4 p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 transition hover:border-primary-300 hover:bg-primary-50/40">
            <i className="ti ti-upload text-3xl text-primary-500" />
            <span>
              <strong className="text-slate-700">Arrastra el archivo</strong> o
              haz clic para seleccionarlo
            </span>
            <span className="text-xs text-slate-400">
              Formatos aceptados: .xlsx, .xls. Tamaño máximo 10 MB.
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileSelected(file);
              }}
            />
          </label>

          {uploading && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-200">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Procesando el Excel. Puede tomar varios minutos según el tamaño.
            </div>
          )}

          {result && (
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-green-50 p-4 ring-1 ring-green-200 sm:grid-cols-4">
              <Stat label="Registros" value={result.registrosProcesados} />
              <Stat label="Bloques nuevos" value={result.bloquesCreados} />
              <Stat label="Bóvedas nuevas" value={result.bovedasCreadas} />
              <Stat label="Contratos" value={result.contratosCreados} />
              {result.errores.length > 0 && (
                <div className="col-span-full mt-2">
                  <p className="text-xs font-semibold text-red-700">
                    {result.errores.length} errores (primeros 5):
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-red-700">
                    {result.errores.slice(0, 5).map((e, i) => (
                      <li key={i}>
                        · {e.sheet} fila {e.fila}: {e.mensaje}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Historial de importaciones
          </h2>
        </header>
        {loadingHistory ? (
          <div className="flex min-h-[12rem] items-center justify-center text-slate-400">
            <svg
              className="h-6 w-6 animate-spin text-primary-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-2.5">Archivo</th>
                  <th className="px-5 py-2.5">Inicio</th>
                  <th className="px-5 py-2.5">Estado</th>
                  <th className="px-5 py-2.5 text-right">Registros</th>
                  <th className="px-5 py-2.5 text-right">Bloques</th>
                  <th className="px-5 py-2.5 text-right">Bóvedas</th>
                  <th className="px-5 py-2.5 text-right">Contratos</th>
                  <th className="px-5 py-2.5">Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Aún no se ha importado ningún catastro.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id}>
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-700">
                        {h.filename}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-500">
                        {formatDateTime(h.fechaInicio)}
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                            ESTADO_TONE[h.estado] ?? ESTADO_TONE.EN_PROGRESO
                          }`}
                        >
                          {h.estado === 'EN_PROGRESO'
                            ? 'En progreso'
                            : h.estado === 'COMPLETADO'
                              ? 'Completado'
                              : 'Error'}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-slate-700">
                        {h.registrosProcesados}
                      </td>
                      <td className="px-5 py-2.5 text-right text-slate-700">
                        {h.bloquesCreados}
                      </td>
                      <td className="px-5 py-2.5 text-right text-slate-700">
                        {h.bovedasCreadas}
                      </td>
                      <td className="px-5 py-2.5 text-right text-slate-700">
                        {h.contratosCreados}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-500">
                        {h.adminUser
                          ? `${h.adminUser.nombre} ${h.adminUser.apellido}`
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-green-700">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-green-800">{value}</p>
    </div>
  );
}
