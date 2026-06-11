'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Download,
  FileDown,
  FileText,
  FolderX,
  Table,
  X,
} from 'lucide-react';
import {
  exhumacionesApi,
  MOTIVOS_EXHUMACION,
  MOTIVO_EXHUMACION_LABEL,
  type ExhumacionResponse,
  type MotivoExhumacion,
  type PaginationMeta,
} from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  PageHeader,
  Pagination,
  Select,
  type DataTableColumn,
} from '@/components/ui';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-EC');
}

const PAGE_SIZE = 15;

export default function ExhumacionesPage() {
  const [rows, setRows] = useState<ExhumacionResponse[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const [page, setPage] = useState(1);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [motivo, setMotivo] = useState<MotivoExhumacion | ''>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await exhumacionesApi.findPage({
          page,
          limit: PAGE_SIZE,
          desde: desde || undefined,
          hasta: hasta || undefined,
          motivo: motivo || undefined,
        });
        if (cancelled) return;
        setRows(result.data ?? []);
        setMeta(result.meta);
      } catch (err: any) {
        if (!cancelled)
          setError(err.message || 'No se pudieron cargar las exhumaciones');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, desde, hasta, motivo]);

  const clearFilters = () => {
    setPage(1);
    setDesde('');
    setHasta('');
    setMotivo('');
  };

  const hasFilters = Boolean(desde || hasta || motivo);

  const handleDescargarActa = async (exh: ExhumacionResponse) => {
    try {
      const { blob, filename } = await exhumacionesApi.actaPdf(exh.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? `acta-exhumacion-${exh.numeroActa}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      setError(err.message || 'No se pudo descargar el acta');
    }
  };

  const handleExport = async (formato: 'pdf' | 'excel' | 'csv') => {
    setDownloading(true);
    setError('');
    try {
      const { blob, filename } = await exhumacionesApi.descargarHistorial(
        formato,
        {
          desde: desde || undefined,
          hasta: hasta || undefined,
          motivo: motivo || undefined,
        },
      );
      const ext = formato === 'excel' ? 'xlsx' : formato;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? `historial-exhumaciones.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      setError(err.message || 'No se pudo exportar el historial');
    } finally {
      setDownloading(false);
    }
  };

  const columns: DataTableColumn<ExhumacionResponse>[] = [
    {
      key: 'numeroActa',
      header: 'Acta',
      width: 'w-28',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {row.numeroActa}
        </span>
      ),
    },
    {
      key: 'fechaExhumacion',
      header: 'Fecha',
      cell: (row) => (
        <span className="text-slate-600">{formatDate(row.fechaExhumacion)}</span>
      ),
    },
    {
      key: 'difunto',
      header: 'Difunto',
      cell: (row) =>
        row.difunto ? (
          <Link
            href={`/difuntos/${row.difuntoId}`}
            className="font-medium text-primary-600 transition-colors duration-150 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1"
          >
            {row.difunto.nombre} {row.difunto.apellido}
          </Link>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'motivo',
      header: 'Motivo',
      cell: (row) => (
        <span className="text-slate-600">
          {MOTIVO_EXHUMACION_LABEL[row.motivo] ?? row.motivo}
        </span>
      ),
    },
    {
      key: 'destino',
      header: 'Destino',
      cell: (row) => <span className="text-slate-600">{row.destino}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) =>
        row.estado ? (
          <Badge tone="warning" dot>
            Registrada
          </Badge>
        ) : (
          <Badge tone="neutral" dot>
            Anulada
          </Badge>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      width: 'w-32',
      cell: (row) => (
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          onClick={() => handleDescargarActa(row)}
          className="text-primary-600 hover:text-primary-700"
          aria-label={`Descargar acta ${row.numeroActa}`}
        >
          Acta
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Exhumaciones"
        subtitle="Historial de exhumaciones y traslados registrados."
        icon={<ArrowLeftRight className="h-5 w-5" strokeWidth={2} aria-hidden="true" />}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              loading={downloading}
              leftIcon={<FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
              onClick={() => handleExport('pdf')}
            >
              PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={downloading}
              leftIcon={<Table className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
              onClick={() => handleExport('excel')}
            >
              Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={downloading}
              leftIcon={<FileDown className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
              onClick={() => handleExport('csv')}
            >
              CSV
            </Button>
          </>
        }
      />

      <Card padding="none">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Desde" htmlFor="exh-desde">
              <input
                id="exh-desde"
                type="date"
                value={desde}
                onChange={(e) => {
                  setPage(1);
                  setDesde(e.target.value);
                }}
                className="block h-10 w-full rounded-lg border-0 bg-white px-3 py-2 text-base text-slate-900 shadow-xs ring-1 ring-inset ring-slate-200 transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </Field>
            <Field label="Hasta" htmlFor="exh-hasta">
              <input
                id="exh-hasta"
                type="date"
                value={hasta}
                onChange={(e) => {
                  setPage(1);
                  setHasta(e.target.value);
                }}
                className="block h-10 w-full rounded-lg border-0 bg-white px-3 py-2 text-base text-slate-900 shadow-xs ring-1 ring-inset ring-slate-200 transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </Field>
            <Select
              label="Motivo"
              value={motivo}
              onChange={(e) => {
                setPage(1);
                setMotivo(e.target.value as MotivoExhumacion | '');
              }}
            >
              <option value="">Todos</option>
              {MOTIVOS_EXHUMACION.map((m) => (
                <option key={m} value={m}>
                  {MOTIVO_EXHUMACION_LABEL[m]}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="ghost"
            size="md"
            disabled={!hasFilters}
            onClick={clearFilters}
            leftIcon={<X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            className="self-end"
          >
            Limpiar
          </Button>
        </div>

        {error && (
          <div className="border-b border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={loading}
          empty={
            <EmptyState
              icon={<FolderX className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />}
              title="No hay exhumaciones registradas"
              description={
                hasFilters
                  ? 'Ajusta los filtros para ampliar la búsqueda.'
                  : 'Aún no se han registrado exhumaciones ni traslados.'
              }
            />
          }
        />

        {meta && meta.total > 0 && (
          <div className="border-t border-slate-100 px-4 py-3">
            <Pagination
              page={meta.page}
              pageCount={meta.totalPages}
              total={meta.total}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
