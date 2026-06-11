'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Coins, Eye, FileText, FolderX, Receipt } from 'lucide-react';
import { pagosApi } from '@/lib/api';
import {
  Badge,
  DataTable,
  EmptyState,
  type DataTableColumn,
} from '@/components/ui';

interface Pago {
  id: number;
  numeroRecibo: string;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  referencia: string | null;
  estado: boolean;
  cuotas: {
    cuota: {
      contrato: {
        id: number;
        difunto: { nombre: string; apellido: string };
      };
    };
  }[];
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-EC');
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPagos();
  }, []);

  const loadPagos = async () => {
    setError('');
    try {
      const data = await pagosApi.findAll();
      setPagos(data);
    } catch (error: any) {
      setError(error.message || 'No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const getContrato = (pago: Pago) => pago.cuotas[0]?.cuota?.contrato;

  const columns: DataTableColumn<Pago>[] = [
    {
      key: 'numeroRecibo',
      header: 'Recibo',
      sortable: true,
      sortValue: (pago) => pago.numeroRecibo,
      cell: (pago) => (
        <span className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
          {pago.numeroRecibo}
        </span>
      ),
    },
    {
      key: 'fechaPago',
      header: 'Fecha',
      sortable: true,
      sortValue: (pago) => pago.fechaPago,
      cell: (pago) => (
        <span className="whitespace-nowrap text-slate-600">
          {formatDate(pago.fechaPago)}
        </span>
      ),
    },
    {
      key: 'beneficiario',
      header: 'Beneficiario',
      sortable: true,
      sortValue: (pago) => {
        const difunto = getContrato(pago)?.difunto;
        return difunto ? `${difunto.apellido} ${difunto.nombre}` : null;
      },
      cell: (pago) => (
        <span className="text-slate-700">
          {pago.cuotas[0]?.cuota.contrato.difunto.nombre}{' '}
          {pago.cuotas[0]?.cuota.contrato.difunto.apellido}
        </span>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      sortable: true,
      sortValue: (pago) => Number(pago.monto ?? 0),
      cell: (pago) => (
        <span className="whitespace-nowrap font-medium text-slate-700">
          {formatCurrency(pago.monto)}
        </span>
      ),
    },
    {
      key: 'metodoPago',
      header: 'Método',
      sortable: true,
      sortValue: (pago) => pago.metodoPago,
      cell: (pago) => <span className="text-slate-600">{pago.metodoPago}</span>,
    },
    {
      key: 'referencia',
      header: 'Referencia',
      sortable: true,
      sortValue: (pago) => pago.referencia,
      cell: (pago) => (
        <span className="text-slate-500">{pago.referencia || '-'}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      sortValue: (pago) => (pago.estado ? 'Activo' : 'Anulado'),
      cell: (pago) =>
        pago.estado ? (
          <Badge tone="success" dot>
            Activo
          </Badge>
        ) : (
          <Badge tone="neutral" dot>
            Anulado
          </Badge>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cell: (pago) => (
        <div className="inline-flex items-center gap-1">
          <Link
            href={`/pagos/${pago.id}`}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
          <a
            href={`/api/pagos/${pago.id}/factura.pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
            title="Ver factura PDF"
          >
            <FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </a>
          {getContrato(pago)?.id && (
            <Link
              href={`/cobros/${getContrato(pago)?.id}/cobrar`}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
              title="Ir al cobro del contrato"
            >
              <Coins className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Listado de pagos registrados en el sistema.
          </p>
        </div>
        <Link
          href="/cobros"
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <Receipt className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Registrar cobro
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <Receipt
            className="h-4 w-4 text-primary-500"
            strokeWidth={2}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-slate-700">Lista de Pagos</h3>
        </header>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={pagos}
          rowKey={(pago) => pago.id}
          loading={loading}
          empty={
            <EmptyState
              icon={
                <FolderX className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
              }
              title="No hay pagos registrados."
              compact
            />
          }
        />
      </section>
    </div>
  );
}
