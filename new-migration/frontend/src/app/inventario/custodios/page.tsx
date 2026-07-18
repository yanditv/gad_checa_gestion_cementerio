'use client';

import { useEffect, useState } from 'react';
import { FolderX, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { inventarioCustodiosApi, PaginationMeta } from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DataTable,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  type DataTableColumn,
} from '@/components/ui';
import { CustodioFormModal } from './CustodioFormModal';

interface Custodio {
  id: number;
  nombre: string;
  identificacion: string | null;
  cargo: string | null;
  estado: boolean;
}

const PAGE_SIZE = 15;

export default function CustodiosPage() {
  const [custodios, setCustodios] = useState<Custodio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustodio, setEditingCustodio] = useState<Custodio | null>(null);

  useEffect(() => {
    loadCustodios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, includeInactive, filtro]);

  const loadCustodios = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await inventarioCustodiosApi.findPage({
        page,
        limit: PAGE_SIZE,
        search: filtro.trim() || undefined,
        includeInactive: includeInactive ? 'true' : undefined,
      });
      setCustodios(result.data);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los custodios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar este custodio?')) return;

    setDeletingId(id);
    setError('');
    try {
      await inventarioCustodiosApi.delete(id);
      if (custodios.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadCustodios();
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo desactivar el custodio');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<Custodio>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      cell: (row) => (
        <span className="font-medium text-slate-900">{row.nombre}</span>
      ),
    },
    {
      key: 'identificacion',
      header: 'Identificación',
      cell: (row) => (
        <span className="text-slate-600">{row.identificacion || '-'}</span>
      ),
    },
    {
      key: 'cargo',
      header: 'Cargo',
      cell: (row) => <span className="text-slate-600">{row.cargo || '-'}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) =>
        row.estado ? (
          <Badge tone="success">Activo</Badge>
        ) : (
          <Badge tone="neutral">Inactivo</Badge>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cellClassName: 'whitespace-nowrap',
      cell: (row) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setEditingCustodio(row);
              setShowFormModal(true);
            }}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
            title="Editar"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            disabled={deletingId === row.id || !row.estado}
            className="rounded-md p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            title="Desactivar"
          >
            {deletingId === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Custodios"
        subtitle="Responsables de los bienes del inventario."
        actions={
          <Button
            onClick={() => {
              setEditingCustodio(null);
              setShowFormModal(true);
            }}
            leftIcon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          >
            Nuevo custodio
          </Button>
        }
      />

      <Card padding="none">
        <div className="border-b border-slate-100 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-center">
            <Input
              type="search"
              placeholder="Nombre, identificación o cargo"
              leftIcon={
                <Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              }
              value={filtro}
              onChange={(e) => {
                setPage(1);
                setFiltro(e.target.value);
              }}
            />
            <Checkbox
              label="Mostrar inactivos"
              checked={includeInactive}
              onChange={(e) => {
                setPage(1);
                setIncludeInactive(e.target.checked);
              }}
            />
          </div>
        </div>

        {error && (
          <div className="border-t border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={custodios}
          rowKey={(row) => row.id}
          loading={loading}
          empty={
            <EmptyState
              icon={
                <FolderX className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              }
              title="No hay custodios registrados."
              compact
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

      <CustodioFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingCustodio(null);
        }}
        onSaved={loadCustodios}
        custodio={editingCustodio}
      />
    </div>
  );
}
