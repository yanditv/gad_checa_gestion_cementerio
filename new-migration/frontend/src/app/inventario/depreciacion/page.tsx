'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  FolderX,
  RefreshCw,
} from 'lucide-react';
import {
  inventarioCategoriasApi,
  inventarioCustodiosApi,
  inventarioDepreciacionApi,
  DepreciacionFila,
  ReporteDepreciacion,
  RecalcularDepreciacionResult,
} from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DataTable,
  DatePicker,
  EmptyState,
  PageHeader,
  Select,
  type DataTableColumn,
} from '@/components/ui';

interface CategoriaResumen {
  id: number;
  nombre: string;
}

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

  const columns: DataTableColumn<DepreciacionFila>[] = [
    {
      key: 'codigo',
      header: 'Código',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {row.codigo}
        </span>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      cell: (row) => (
        <span className="font-medium text-slate-900">
          {row.descripcion}
          {row.dadoDeBaja && (
            <span className="ml-2 inline-flex">
              <Badge tone="danger" size="sm">
                Dado de baja
              </Badge>
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      cell: (row) => (
        <span className="text-slate-600">{row.categoriaNombre || '-'}</span>
      ),
    },
    {
      key: 'valorAdquisicion',
      header: 'Valor adquisición',
      align: 'right',
      cell: (row) => (
        <span className="font-medium text-slate-700">
          {formatMoney(row.valorAdquisicion)}
        </span>
      ),
    },
    {
      key: 'depreciacionAcumulada',
      header: 'Deprec. acumulada',
      align: 'right',
      cell: (row) => (
        <span className="text-slate-600">
          {formatMoney(row.depreciacionAcumulada)}
        </span>
      ),
    },
    {
      key: 'valorEnLibros',
      header: 'Valor en libros',
      align: 'right',
      cell: (row) => (
        <span className="font-semibold text-slate-900">
          {formatMoney(row.valorEnLibros)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Depreciación de bienes"
        subtitle="Valor en libros de la propiedad, planta y equipo del GAD a una fecha de corte (línea recta, CGE 406-03)."
      />

      <div className="space-y-6">
        {/* Control de recálculo de periodo (solo Administrador) */}
        {isAdmin && (
          <section className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60 shadow-soft">
            <div className="flex items-center gap-2 border-b border-amber-100 px-4 py-3">
              <RefreshCw className="h-4 w-4 text-amber-600" strokeWidth={2} aria-hidden="true" />
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
                <Select
                  label="Año"
                  wrapperClassName="sm:w-44"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  disabled={recalculando}
                >
                  {anioOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Mes"
                  wrapperClassName="sm:w-52"
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  disabled={recalculando}
                >
                  {MESES.map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Button
                  onClick={handleRecalcular}
                  loading={recalculando}
                  leftIcon={
                    <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  }
                  className="bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-300"
                >
                  {recalculando ? 'Recalculando…' : 'Recalcular periodo'}
                </Button>
              </div>

              {recalcError && (
                <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {recalcError}
                </div>
              )}
              {recalcResult && (
                <div className="flex items-start gap-2 rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                  <span>
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
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tabla de depreciación por bien */}
        <Card padding="none">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DatePicker
                id="dep-fecha-corte"
                label="Fecha de corte"
                value={fechaCorte}
                onChange={(v) => setFechaCorte(v)}
              />
              <Select
                label="Categoría"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
              <Select
                label="Custodio"
                value={custodioId}
                onChange={(e) => setCustodioId(e.target.value)}
              >
                <option value="">Todos los custodios</option>
                {custodios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
              <div className="flex items-end">
                <Checkbox
                  label="Incluir bienes dados de baja"
                  checked={incluirBajas}
                  onChange={(e) => setIncluirBajas(e.target.checked)}
                />
              </div>
            </div>
            {reporte && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                Depreciación calculada al{' '}
                <strong className="text-slate-700">
                  {formatDate(reporte.fechaCorte)}
                </strong>
                .
              </p>
            )}
          </div>

          {error && (
            <div className="border-t border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              {error}
            </div>
          )}

          <DataTable
            columns={columns}
            rows={filas}
            rowKey={(row) => row.id}
            loading={loading}
            empty={
              <EmptyState
                icon={
                  <FolderX className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                }
                title="No hay bienes para los filtros seleccionados."
                compact
              />
            }
          />

          {!loading && filas.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50">
              <table className="min-w-full text-sm">
                <tbody>
                  <tr className="font-semibold text-slate-800">
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
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
