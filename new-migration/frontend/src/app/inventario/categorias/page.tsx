'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderX, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { inventarioCategoriasApi, PaginationMeta } from '@/lib/api';
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

interface Categoria {
  id: number;
  nombre: string;
  vidaUtilAnios: number;
  valorResidualPct: number;
  estado: boolean;
}

const PAGE_SIZE = 15;

export default function CategoriasBienPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, includeInactive, filtroNombre]);

  const loadCategorias = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await inventarioCategoriasApi.findPage({
        page,
        limit: PAGE_SIZE,
        search: filtroNombre.trim() || undefined,
        includeInactive: includeInactive ? 'true' : undefined,
      });
      setCategorias(result.data);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar esta categoría?')) return;

    setDeletingId(id);
    setError('');
    try {
      await inventarioCategoriasApi.delete(id);
      if (categorias.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadCategorias();
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo desactivar la categoría');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<Categoria>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      cell: (row) => (
        <span className="font-medium text-slate-900">{row.nombre}</span>
      ),
    },
    {
      key: 'vidaUtilAnios',
      header: 'Vida útil (años)',
      cell: (row) => <span className="text-slate-600">{row.vidaUtilAnios}</span>,
    },
    {
      key: 'valorResidualPct',
      header: 'Valor residual',
      cell: (row) => (
        <span className="text-slate-600">{row.valorResidualPct}%</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) =>
        row.estado ? (
          <Badge tone="success">Activa</Badge>
        ) : (
          <Badge tone="neutral">Inactiva</Badge>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cellClassName: 'whitespace-nowrap',
      cell: (row) => (
        <div className="inline-flex items-center gap-1">
          <Link
            href={`/inventario/categorias/${row.id}/edit`}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
            title="Editar"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
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
        title="Categorías de bienes"
        subtitle="Vida útil y valor residual para el cálculo de depreciación."
        actions={
          <Link
            href="/inventario/categorias/create"
            className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Nueva categoría
          </Link>
        }
      />

      <Card padding="none">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:items-center">
            <Input
              type="search"
              placeholder="Nombre de la categoría"
              leftIcon={
                <Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              }
              value={filtroNombre}
              onChange={(e) => {
                setPage(1);
                setFiltroNombre(e.target.value);
              }}
            />
            <Checkbox
              label="Mostrar inactivas"
              checked={includeInactive}
              onChange={(e) => {
                setPage(1);
                setIncludeInactive(e.target.checked);
              }}
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPage(1);
              setFiltroNombre('');
            }}
            leftIcon={<X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          >
            Limpiar
          </Button>
        </div>

        {error && (
          <div className="border-t border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={categorias}
          rowKey={(row) => row.id}
          loading={loading}
          empty={
            <EmptyState
              icon={
                <FolderX className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              }
              title="No hay categorías registradas."
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
    </div>
  );
}
