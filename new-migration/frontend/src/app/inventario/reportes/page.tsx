'use client';

import { useEffect, useState } from 'react';
import {
  inventarioCategoriasApi,
  inventarioCustodiosApi,
  inventarioReportesApi,
  type FormatoReporteInventario,
  type ReporteInventarioFiltros,
  type TipoReporteInventario,
} from '@/lib/api';

interface OpcionResumen {
  id: number;
  nombre: string;
}

interface ReporteDef {
  tipo: TipoReporteInventario;
  title: string;
  description: string;
  icon: string;
  tone: string;
  /** Filtros que aplican a este reporte. */
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
    icon: 'ti-user-check',
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
    icon: 'ti-map-pin',
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
    icon: 'ti-category',
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
    icon: 'ti-trending-down',
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
    icon: 'ti-file-certificate',
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
  icon: string;
  cls: string;
}[] = [
  {
    formato: 'pdf',
    label: 'PDF',
    icon: 'ti-file-type-pdf',
    cls: 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100',
  },
  {
    formato: 'excel',
    label: 'Excel',
    icon: 'ti-file-type-xls',
    cls: 'bg-green-50 text-green-700 ring-green-200 hover:bg-green-100',
  },
  {
    formato: 'csv',
    label: 'CSV',
    icon: 'ti-file-type-csv',
    cls: 'bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200',
  },
];

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200';

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

export default function ReportesInventarioPage() {
  const [categorias, setCategorias] = useState<OpcionResumen[]>([]);
  const [custodios, setCustodios] = useState<OpcionResumen[]>([]);

  const [categoriaId, setCategoriaId] = useState('');
  const [custodioId, setCustodioId] = useState('');
  const [custodioSalienteId, setCustodioSalienteId] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [incluirBajas, setIncluirBajas] = useState(false);
  const [fechaCorte, setFechaCorte] = useState('');

  const [descargando, setDescargando] = useState<string | null>(null);
  const [error, setError] = useState('');

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
    if (def.usaCustodioSaliente && custodioSalienteId)
      filtros.custodioSalienteId = custodioSalienteId;
    if (def.usaUbicacion && ubicacion.trim())
      filtros.ubicacion = ubicacion.trim();
    if (def.usaIncluirBajas && incluirBajas) filtros.incluirBajas = true;
    if (def.usaFechaCorte && fechaCorte) filtros.fechaCorte = fechaCorte;
    return filtros;
  }

  async function descargar(
    def: ReporteDef,
    formato: FormatoReporteInventario,
  ) {
    const key = `${def.tipo}:${formato}`;
    setDescargando(key);
    setError('');
    try {
      const { blob, filename } = await inventarioReportesApi.descargar(
        def.tipo,
        formato,
        filtrosPara(def),
      );
      const ext = formato === 'excel' ? 'xlsx' : formato;
      triggerDownload(blob, filename ?? `${def.tipo}.${ext}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo generar el reporte solicitado.',
      );
    } finally {
      setDescargando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Reportes de inventario
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aplica filtros y descarga cada reporte en PDF, Excel o CSV.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Filtros</h2>
          <p className="text-xs text-slate-500">
            Se aplican a cada reporte según corresponda. Déjalos vacíos para
            incluir todo.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Categoría
            </label>
            <select
              className={INPUT_CLS}
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Todas</option>
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
              className={INPUT_CLS}
              value={custodioId}
              onChange={(e) => setCustodioId(e.target.value)}
            >
              <option value="">Todos</option>
              {custodios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Ubicación
            </label>
            <input
              type="text"
              className={INPUT_CLS}
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Coincidencia parcial"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Fecha de corte
              <span className="ml-1 text-slate-400">(depreciación)</span>
            </label>
            <input
              type="date"
              className={INPUT_CLS}
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Custodio saliente
              <span className="ml-1 text-slate-400">(acta)</span>
            </label>
            <select
              className={INPUT_CLS}
              value={custodioSalienteId}
              onChange={(e) => setCustodioSalienteId(e.target.value)}
            >
              <option value="">Ninguno</option>
              {custodios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-200"
                checked={incluirBajas}
                onChange={(e) => setIncluirBajas(e.target.checked)}
              />
              Incluir bienes dados de baja
            </label>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REPORTES.map((def) => (
          <div
            key={def.tipo}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft"
          >
            <div className="flex items-start gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${def.tone}`}
              >
                <i className={`ti ${def.icon} text-xl`} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-700">
                  {def.title}
                </h3>
                <p className="text-xs text-slate-500">{def.description}</p>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-2">
              {FORMATOS.map((f) => {
                const key = `${def.tipo}:${f.formato}`;
                const busy = descargando === key;
                return (
                  <button
                    key={f.formato}
                    type="button"
                    disabled={descargando !== null}
                    onClick={() => descargar(def, f.formato)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ring-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${f.cls}`}
                  >
                    <i
                      className={`ti ${busy ? 'ti-loader-2 animate-spin' : f.icon} text-base`}
                    />
                    {busy ? 'Generando…' : f.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
