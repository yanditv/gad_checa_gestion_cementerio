'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  FileDown,
  Loader2,
  UserCheck,
  MapPin,
  FolderTree,
  TrendingDown,
  ScrollText,
} from 'lucide-react';
import {
  inventarioCategoriasApi,
  inventarioCustodiosApi,
  inventarioReportesApi,
  type FormatoReporteInventario,
  type ReporteInventarioFiltros,
  type TipoReporteInventario,
} from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';

interface OpcionResumen {
  id: number;
  nombre: string;
}

interface ReporteDef {
  tipo: TipoReporteInventario;
  title: string;
  description: string;
  icon: typeof UserCheck;
  tone: string;
  usaCategoria: boolean;
  usaCustodio: boolean;
  usaUbicacion: boolean;
  usaIncluirBajas: boolean;
  usaFechaCorte: boolean;
  usaCustodioSaliente: boolean;
}

const REPORTES: ReporteDef[] = [
  {
    tipo: 'por-custodio',
    title: 'Inventario por custodio',
    description: 'Bienes agrupados por responsable, con valor total por grupo.',
    icon: UserCheck,
    tone: 'bg-primary-50 text-primary-600 ring-primary-200',
    usaCategoria: true,
    usaCustodio: true,
    usaUbicacion: true,
    usaIncluirBajas: true,
    usaFechaCorte: false,
    usaCustodioSaliente: false,
  },
  {
    tipo: 'por-ubicacion',
    title: 'Inventario por ubicación',
    description: 'Bienes agrupados por ubicación física dentro de la institución.',
    icon: MapPin,
    tone: 'bg-info-50 text-info-600 ring-info-200',
    usaCategoria: true,
    usaCustodio: true,
    usaUbicacion: true,
    usaIncluirBajas: true,
    usaFechaCorte: false,
    usaCustodioSaliente: false,
  },
  {
    tipo: 'por-categoria',
    title: 'Inventario por categoría',
    description: 'Bienes agrupados por categoría contable del catálogo.',
    icon: FolderTree,
    tone: 'bg-warning-50 text-warning-600 ring-warning-200',
    usaCategoria: true,
    usaCustodio: true,
    usaUbicacion: true,
    usaIncluirBajas: true,
    usaFechaCorte: false,
    usaCustodioSaliente: false,
  },
  {
    tipo: 'depreciacion',
    title: 'Depreciación a fecha de corte',
    description: 'Valor en libros por bien según la fecha de corte (CGE 406-03).',
    icon: TrendingDown,
    tone: 'bg-danger-50 text-danger-600 ring-danger-200',
    usaCategoria: true,
    usaCustodio: true,
    usaUbicacion: true,
    usaIncluirBajas: true,
    usaFechaCorte: true,
    usaCustodioSaliente: false,
  },
  {
    tipo: 'acta-entrega',
    title: 'Acta de entrega-recepción',
    description: 'Acta de bienes del custodio entrante para firma de traspaso.',
    icon: ScrollText,
    tone: 'bg-success-50 text-success-600 ring-success-200',
    usaCategoria: true,
    usaCustodio: true,
    usaUbicacion: true,
    usaIncluirBajas: false,
    usaFechaCorte: false,
    usaCustodioSaliente: true,
  },
];

const FORMATOS: {
  formato: FormatoReporteInventario;
  label: string;
  icon: typeof FileText;
  variant: 'danger' | 'primary' | 'secondary';
}[] = [
  { formato: 'pdf', label: 'PDF', icon: FileText, variant: 'danger' },
  { formato: 'excel', label: 'Excel', icon: FileSpreadsheet, variant: 'primary' },
  { formato: 'csv', label: 'CSV', icon: FileDown, variant: 'secondary' },
];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fmtCurrency(n: number | string): string {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(v);
}

function countItems(data: any): number {
  if (Array.isArray(data)) {
    if (data.length === 0) return 0;
    if (data[0]?.bienes) return data.reduce((s: number, g: any) => s + (g.bienes?.length ?? 0), 0);
    return data.length;
  }
  if (data?.filas) return data.filas.length;
  if (data?.bienes) return data.bienes.length;
  return 0;
}

function totalValue(data: any): number {
  if (Array.isArray(data)) {
    if (data.length === 0) return 0;
    if (data[0]?.total) return data.reduce((s: number, g: any) => s + Number(g.total ?? 0), 0);
    if (data[0]?.bienes) return data.reduce((s: number, g: any) => s + Number(g.valorAdquisicion ?? 0), 0);
    return data.length;
  }
  if (data?.total) return Number(data.total);
  return 0;
}

function firstGroups(data: any, limit = 3): { label: string; count: number; value?: string }[] {
  if (!Array.isArray(data)) return [];
  return data.slice(0, limit).map((g: any) => ({
    label: g.custodio ?? g.ubicacion ?? g.categoria ?? g.nombre ?? '-',
    count: g.bienes?.length ?? g.cantidad ?? 0,
    value: g.total ? fmtCurrency(g.total) : undefined,
  }));
}

export default function ReportesInventarioPage() {
  const [categorias, setCategorias] = useState<OpcionResumen[]>([]);
  const [custodios, setCustodios] = useState<OpcionResumen[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [categoriaId, setCategoriaId] = useState('');
  const [custodioId, setCustodioId] = useState('');
  const [custodioSalienteId, setCustodioSalienteId] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [incluirBajas, setIncluirBajas] = useState(false);
  const [fechaCorte, setFechaCorte] = useState('');

  const [descargando, setDescargando] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  useEffect(() => {
    inventarioCategoriasApi
      .findAll()
      .then((rows) => setCategorias((rows ?? []) as OpcionResumen[]))
      .catch(() => undefined);
    inventarioCustodiosApi
      .findAll()
      .then((rows) => setCustodios((rows ?? []) as OpcionResumen[]))
      .catch(() => undefined);
  }, []);

  function filtrosPara(def: ReporteDef): ReporteInventarioFiltros {
    const filtros: ReporteInventarioFiltros = {};
    if (def.usaCategoria && categoriaId) filtros.categoriaId = categoriaId;
    if (def.usaCustodio && custodioId) filtros.custodioId = custodioId;
    if (def.usaCustodioSaliente && custodioSalienteId) filtros.custodioSalienteId = custodioSalienteId;
    if (def.usaUbicacion && ubicacion.trim()) filtros.ubicacion = ubicacion.trim();
    if (def.usaIncluirBajas && incluirBajas) filtros.incluirBajas = true;
    if (def.usaFechaCorte && fechaCorte) filtros.fechaCorte = fechaCorte;
    return filtros;
  }

  async function descargar(def: ReporteDef, formato: FormatoReporteInventario) {
    const key = `${def.tipo}:${formato}`;
    setDescargando(key);
    setError('');
    try {
      const { blob, filename } = await inventarioReportesApi.descargar(def.tipo, formato, filtrosPara(def));
      const ext = formato === 'excel' ? 'xlsx' : formato;
      triggerDownload(blob, filename ?? `${def.tipo}.${ext}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el reporte solicitado.');
    } finally {
      setDescargando(null);
    }
  }

  const togglePreview = useCallback(
    async (def: ReporteDef) => {
      const key = def.tipo;
      if (previewKey === key) {
        setPreviewKey(null);
        setPreviewData(null);
        return;
      }
      setPreviewLoading(key);
      setError('');
      try {
        // Vista previa siempre sin filtros para asegurar datos de muestra
        const data = await inventarioReportesApi.preview<any>(def.tipo, {});
        setPreviewData(data);
        setPreviewKey(key);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la vista previa.');
      } finally {
        setPreviewLoading(null);
      }
    },
    [previewKey],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes de inventario"
        subtitle="Aplica filtros y descarga cada reporte en PDF, Excel o CSV."
      />

      {error && (
        <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-danger-200">
          {error}
        </div>
      )}

      <Card padding="none">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>Filtros</span>
          {showFilters ? (
            <ChevronUp className="h-4 w-4 text-slate-400" strokeWidth={2} aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" strokeWidth={2} aria-hidden="true" />
          )}
        </button>

        {showFilters && (
          <>
            <div className="border-t border-slate-100 px-5 py-1">
              <p className="text-xs text-slate-500">
                Se aplican a cada reporte según corresponda. Déjalos vacíos para incluir todo.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Categoría"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                options={[
                  { value: '', label: 'Todas' },
                  ...categorias.map((c) => ({ value: c.id, label: c.nombre })),
                ]}
              />

              <Select
                label="Custodio"
                value={custodioId}
                onChange={(e) => setCustodioId(e.target.value)}
                options={[
                  { value: '', label: 'Todos' },
                  ...custodios.map((c) => ({ value: c.id, label: c.nombre })),
                ]}
              />

              <Input
                label="Ubicación"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Coincidencia parcial"
              />

              <DatePicker
                label="Fecha de corte (depreciación)"
                value={fechaCorte}
                onChange={setFechaCorte}
              />

              <Select
                label="Custodio saliente (acta)"
                value={custodioSalienteId}
                onChange={(e) => setCustodioSalienteId(e.target.value)}
                options={[
                  { value: '', label: 'Ninguno' },
                  ...custodios.map((c) => ({ value: c.id, label: c.nombre })),
                ]}
              />

              <div className="flex items-end">
                <Checkbox
                  label="Incluir bienes dados de baja"
                  checked={incluirBajas}
                  onChange={(e) => setIncluirBajas(e.target.checked)}
                />
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REPORTES.map((def) => {
          const Icon = def.icon;
          const previewKey_ = def.tipo;
          const showingPreview = previewKey === previewKey_;
          const loadingPreview = previewLoading === previewKey_;

          return (
            <div
              key={def.tipo}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${def.tone}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-700">{def.title}</h3>
                  <p className="text-xs text-slate-500">{def.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {FORMATOS.map((f) => {
                  const key = `${def.tipo}:${f.formato}`;
                  const busy = descargando === key;
                  const IconF = f.icon;
                  return (
                    <Button
                      key={f.formato}
                      variant={f.variant}
                      size="sm"
                      disabled={descargando !== null}
                      onClick={() => descargar(def, f.formato)}
                      leftIcon={
                        busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
                        ) : (
                          <IconF className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                        )
                      }
                    >
                      {busy ? 'Generando…' : f.label}
                    </Button>
                  );
                })}

                <span className="ml-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => togglePreview(def)}
                    disabled={loadingPreview}
                    leftIcon={
                      loadingPreview ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
                      ) : showingPreview ? (
                        <EyeOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                      )
                    }
                  >
                    {loadingPreview ? 'Cargando…' : showingPreview ? 'Ocultar' : 'Vista previa'}
                  </Button>
                </span>
              </div>

              {showingPreview && previewData && (
                <PreviewContent def={def} data={previewData} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewContent({ def, data }: { def: ReporteDef; data: any }) {
  const items = countItems(data);
  const total = totalValue(data);
  const groups = firstGroups(data);

  if (items === 0) {
    return (
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
        No se encontraron bienes con los filtros aplicados.
      </div>
    );
  }

  if (def.tipo === 'depreciacion') {
    return (
      <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Bienes en reporte</span>
          <Badge tone="info">{items}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Valor en libros</span>
          <span className="font-semibold text-slate-900">{fmtCurrency(total)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Fecha de corte</span>
          <span className="text-slate-700">{data.fechaCorte ?? '-'}</span>
        </div>
      </div>
    );
  }

  if (def.tipo === 'acta-entrega') {
    return (
      <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Bienes incluidos</span>
          <Badge tone="info">{items}</Badge>
        </div>
        {data.custodioEntrante && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Custodio entrante</span>
            <span className="text-slate-700">{data.custodioEntrante}</span>
          </div>
        )}
        {data.custodioSaliente && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Custodio saliente</span>
            <span className="text-slate-700">{data.custodioSaliente}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Grupos</span>
        <Badge tone="info">{Array.isArray(data) ? data.length : 0}</Badge>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Bienes</span>
        <span className="font-semibold text-slate-900">{items}</span>
      </div>
      {total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Valor total</span>
          <span className="font-semibold text-slate-900">{fmtCurrency(total)}</span>
        </div>
      )}
      {groups.length > 0 && (
        <div className="border-t border-slate-200 pt-2">
          <p className="mb-1 text-xs font-medium text-slate-500">Primeros grupos:</p>
          <div className="space-y-1">
            {groups.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                <span className="truncate">{g.label}</span>
                <span>
                  {g.count} bienes{g.value ? ` · ${g.value}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
