'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  inventarioCategoriasApi,
  inventarioCustodiosApi,
  inventarioDepreciacionApi,
  DepreciacionFila,
  ReporteDepreciacion,
  RecalcularDepreciacionResult,
} from '@/lib/api';

interface CategoriaResumen {
  id: number;
  nombre: string;
}

const SELECT_CLS =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200';

const ADMIN_ROLES = ['Admin', 'Administrador'];

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value ?? 0);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-EC');
}

/** Fecha de hoy en formato YYYY-MM-DD (zona local). */
function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DepreciacionPage() {
  const now = new Date();

  // --- Sesión / control de acceso al recálculo -----------------------------
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Tabla de depreciación (reporte a fecha de corte) --------------------
  const [reporte, setReporte] = useState<ReporteDepreciacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fechaCorte, setFechaCorte] = useState(todayIso());
  const [categoriaId, setCategoriaId] = useState('');
  const [custodioId, setCustodioId] = useState('');
  const [incluirBajas, setIncluirBajas] = useState(false);

  const [categorias, setCategorias] = useState<CategoriaResumen[]>([]);
  const [custodios, setCustodios] = useState<{ id: number; nombre: string }[]>(
    [],
  );

  // --- Recálculo de periodo (solo Administrador) ---------------------------
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [recalculando, setRecalculando] = useState(false);
  const [recalcError, setRecalcError] = useState('');
  const [recalcResult, setRecalcResult] =
    useState<RecalcularDepreciacionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const roles: string[] = payload?.data?.roles ?? [];
        setIsAdmin(roles.some((r) => ADMIN_ROLES.includes(r)));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    inventarioCategoriasApi
      .findAll()
      .then((rows) => setCategorias(rows ?? []))
      .catch(() => undefined);
    inventarioCustodiosApi
      .findAll()
      .then((rows) => setCustodios(rows ?? []))
      .catch(() => undefined);
  }, []);

  const loadReporte = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await inventarioDepreciacionApi.reporte({
        fechaCorte: fechaCorte || undefined,
        categoriaId: categoriaId || undefined,
        custodioId: custodioId || undefined,
        incluirBajas: incluirBajas || undefined,
      });
      setReporte(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la depreciación');
      setReporte(null);
    } finally {
      setLoading(false);
    }
  }, [fechaCorte, categoriaId, custodioId, incluirBajas]);

  useEffect(() => {
    loadReporte();
  }, [loadReporte]);

  const handleRecalcular = async () => {
    setRecalculando(true);
    setRecalcError('');
    setRecalcResult(null);
    try {
      const result = await inventarioDepreciacionApi.recalcular(anio, mes);
      setRecalcResult(result);
      // Tras recalcular, refresca la tabla para reflejar el cierre del periodo.
      await loadReporte();
    } catch (err: any) {
      setRecalcError(err.message || 'No se pudo recalcular el periodo');
    } finally {
      setRecalculando(false);
    }
  };

  const filas: DepreciacionFila[] = reporte?.filas ?? [];
  const totalAdquisicion = filas.reduce(
    (s, f) => s + (f.valorAdquisicion ?? 0),
    0,
  );
  const totalAcumulada = filas.reduce(
    (s, f) => s + (f.depreciacionAcumulada ?? 0),
    0,
  );
  const totalLibros = reporte?.total ?? 0;

  const anioOptions = Array.from(
    { length: 6 },
    (_, i) => now.getFullYear() - 4 + i,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Depreciación de bienes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Valor en libros de la propiedad, planta y equipo del GAD a una fecha
          de corte (línea recta, CGE 406-03).
        </p>
      </div>

      {/* Control de recálculo de periodo (solo Administrador) */}
      {isAdmin && (
        <section className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60 shadow-soft">
          <div className="flex items-center gap-2 border-b border-amber-100 px-4 py-3">
            <i className="ti ti-refresh text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-900">
              Recalcular depreciación del periodo
            </h2>
            <span className="ml-auto inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
              Solo Administrador
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <p className="text-xs text-amber-800/90">
              Recorre los bienes activos no dados de baja y registra la
              depreciación mensual del periodo seleccionado. Esta operación
              persiste el cierre contable del mes.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-44">
                <label className="mb-1 block text-xs font-medium text-amber-900">
                  Año
                </label>
                <select
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  className={SELECT_CLS}
                  disabled={recalculando}
                >
                  {anioOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:w-52">
                <label className="mb-1 block text-xs font-medium text-amber-900">
                  Mes
                </label>
                <select
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  className={SELECT_CLS}
                  disabled={recalculando}
                >
                  {MESES.map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleRecalcular}
                disabled={recalculando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {recalculando ? (
                  <>
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
                    Recalculando…
                  </>
                ) : (
                  <>
                    <i className="ti ti-calculator" /> Recalcular periodo
                  </>
                )}
              </button>
            </div>

            {recalcError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {recalcError}
              </div>
            )}
            {recalcResult && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                <i className="ti ti-circle-check mr-1" />
                Periodo {String(recalcResult.mes).padStart(2, '0')}/
                {recalcResult.anio} recalculado:{' '}
                <strong>{recalcResult.bienesProcesados}</strong> bien
                {recalcResult.bienesProcesados === 1 ? '' : 'es'} procesado
                {recalcResult.bienesProcesados === 1 ? '' : 's'}, total
                depreciado del periodo{' '}
                <strong>
                  {formatMoney(recalcResult.totalDepreciadoPeriodo)}
                </strong>
                .
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tabla de depreciación por bien */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Fecha de corte
              </label>
              <input
                type="date"
                value={fechaCorte}
                onChange={(e) => setFechaCorte(e.target.value)}
                className={SELECT_CLS}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Categoría
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Custodio
              </label>
              <select
                value={custodioId}
                onChange={(e) => setCustodioId(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="">Todos los custodios</option>
                {custodios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={incluirBajas}
                  onChange={(e) => setIncluirBajas(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-200"
                />
                Incluir bienes dados de baja
              </label>
            </div>
          </div>
          {reporte && (
            <p className="text-xs text-slate-500">
              Depreciación calculada al{' '}
              <strong className="text-slate-700">
                {formatDate(reporte.fechaCorte)}
              </strong>
              .
            </p>
          )}
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3">
                  Código
                </th>
                <th scope="col" className="px-4 py-3">
                  Descripción
                </th>
                <th scope="col" className="px-4 py-3">
                  Categoría
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Valor adquisición
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Deprec. acumulada
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Valor en libros
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    <div className="inline-flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin text-primary-500"
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
                      Calculando depreciación…
                    </div>
                  </td>
                </tr>
              ) : filas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <i className="ti ti-folder-x text-3xl text-slate-300" />
                    <div className="mt-2 text-sm">
                      No hay bienes para los filtros seleccionados.
                    </div>
                  </td>
                </tr>
              ) : (
                filas.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {row.codigo}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.descripcion}
                      {row.dadoDeBaja && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-200">
                          Dado de baja
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.categoriaNombre || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {formatMoney(row.valorAdquisicion)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatMoney(row.depreciacionAcumulada)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatMoney(row.valorEnLibros)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && filas.length > 0 && (
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr className="text-sm font-semibold text-slate-800">
                  <td className="px-4 py-3" colSpan={3}>
                    Totales ({filas.length} bien
                    {filas.length === 1 ? '' : 'es'})
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatMoney(totalAdquisicion)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatMoney(totalAcumulada)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatMoney(totalLibros)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
