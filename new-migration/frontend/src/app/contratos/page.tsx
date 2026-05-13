'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DataGrid, DataGridColumn } from '@/components/ui/DataGrid';
import { PaginationNav } from '@/components/ui/PaginationNav';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { SelectInput } from '@/components/ui/SelectInput';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { PageHeader } from '@/components/ui/PageHeader';
import { PaginationMeta } from '@/lib/api';

type EstadoFiltro = '' | 'activos' | 'porvencer' | 'vencidos' | 'inactivos';

interface Contrato {
  id: number;
  numeroSecuencial: string;
  fechaInicio: string;
  fechaFin: string | null;
  montoTotal: number | string;
  estado: boolean;
  esRenovacion: boolean;
  boveda: {
    numero: string;
    bloque: { nombre: string };
    propietario?: { persona: { nombre: string; apellido: string } } | null;
  };
  difunto: {
    nombre: string;
    apellido: string;
    numeroIdentificacion: string | null;
  };
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

/** Estado visible calculado en cliente para badges. */
function estadoLabel(row: Contrato): {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'secondary';
} {
  if (!row.estado) return { label: 'Inactivo', variant: 'secondary' };
  if (!row.fechaFin) return { label: 'Activo', variant: 'success' };
  const fin = new Date(row.fechaFin);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const en30 = new Date(hoy);
  en30.setDate(en30.getDate() + 30);
  if (fin < hoy) return { label: 'Vencido', variant: 'danger' };
  if (fin <= en30) return { label: 'Por vencer', variant: 'warning' };
  return { label: 'Activo', variant: 'success' };
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [estado, setEstado] = useState<EstadoFiltro>('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '15',
        });
        if (searchTerm.trim()) params.set('search', searchTerm.trim());
        if (estado) params.set('estado', estado);

        const response = await fetch(`/api/contratos?${params.toString()}`, {
          signal: controller.signal,
          credentials: 'same-origin',
        });
        if (!response.ok) throw new Error('Error al cargar contratos');
        const payload = await response.json();
        if (!cancelled) {
          setContratos(payload.data || []);
          setMeta(payload.meta);
        }
      } catch (err) {
        if (!cancelled && (err as Error).name !== 'AbortError') {
          console.error('Error loading contratos', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, searchTerm, estado]);

  const columns: DataGridColumn<Contrato>[] = [
    {
      key: 'numero',
      title: 'Número',
      render: (row) => <strong>{row.numeroSecuencial}</strong>,
    },
    {
      key: 'difunto',
      title: 'Difunto',
      render: (row) => (
        <>
          <div>{`${row.difunto?.nombre || ''} ${row.difunto?.apellido || ''}`.trim()}</div>
          {row.difunto?.numeroIdentificacion && (
            <small className="text-muted">{row.difunto.numeroIdentificacion}</small>
          )}
        </>
      ),
    },
    {
      key: 'boveda',
      title: 'Bóveda / Bloque',
      render: (row) => (
        <>
          <div>{row.boveda?.numero || '-'}</div>
          <small className="text-muted">{row.boveda?.bloque?.nombre || '-'}</small>
        </>
      ),
    },
    {
      key: 'propietario',
      title: 'Propietario',
      render: (row) =>
        row.boveda?.propietario?.persona
          ? `${row.boveda.propietario.persona.nombre} ${row.boveda.propietario.persona.apellido}`
          : '-',
    },
    {
      key: 'monto',
      title: 'Monto',
      render: (row) => formatCurrency(row.montoTotal),
    },
    {
      key: 'vigencia',
      title: 'Vigencia',
      render: (row) => (
        <>
          <div>{formatDate(row.fechaInicio)}</div>
          <small className="text-muted">→ {formatDate(row.fechaFin)}</small>
        </>
      ),
    },
    {
      key: 'tipo',
      title: 'Tipo',
      render: (row) =>
        row.esRenovacion ? (
          <span className="badge bg-info-subtle text-info">Renovación</span>
        ) : (
          <span className="badge bg-primary-subtle text-primary">Nuevo</span>
        ),
    },
    {
      key: 'estado',
      title: 'Estado',
      render: (row) => {
        const e = estadoLabel(row);
        return <span className={`badge bg-${e.variant}`}>{e.label}</span>;
      },
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (row) => (
        <div className="actions">
          <Link href={`/contratos/${row.id}`} className="action-btn" title="Ver">
            <i className="ti ti-eye"></i>
          </Link>
          <Link
            href={`/contratos/${row.id}/edit`}
            className="action-btn"
            title="Editar"
          >
            <i className="ti ti-edit"></i>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lista de Contratos"
        subtitle="Gestión de contratos de arrendamiento"
        actions={
          <Button href="/contratos/create" icon="ti-plus">
            Nuevo Contrato
          </Button>
        }
      />

      <div className="card">
        <SearchFilters>
          <div style={{ maxWidth: '320px', width: '100%' }}>
            <TextInput
              icon="ti-search"
              type="text"
              placeholder="Buscar por número, difunto o identificación…"
              value={searchTerm}
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
              }}
            />
          </div>
          <SelectInput
            style={{ width: '200px' }}
            value={estado}
            onChange={(e) => {
              setPage(1);
              setEstado(e.target.value as EstadoFiltro);
            }}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'activos', label: 'Activos' },
              { value: 'porvencer', label: 'Por vencer (30 días)' },
              { value: 'vencidos', label: 'Vencidos' },
              { value: 'inactivos', label: 'Inactivos' },
            ]}
          />
        </SearchFilters>
        <DataGrid
          columns={columns}
          rows={contratos}
          rowKey={(row) => row.id}
          loading={loading}
          emptyMessage="No hay contratos que coincidan con los filtros"
        />
        <PaginationNav meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
