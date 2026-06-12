'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, FolderX, Plus, Search, X } from 'lucide-react';
import {
  inventarioBienesApi,
  inventarioCategoriasApi,
  inventarioCustodiosApi,
  mediaUrl,
  PaginationMeta,
} from '@/lib/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  Select,
  type DataTableColumn,
} from '@/components/ui';

interface CategoriaResumen {
  id: number;
  nombre: string;
}

interface BienListItem {
  id: number;
  codigo: string;
  descripcion: string;
  marca: string | null;
  serie: string | null;
  fechaAdquisicion: string;
  valorAdquisicion: number;
  estadoConservacion: string;
  ubicacion: string | null;
  dadoDeBaja: boolean;
  fotoUrl: string | null;
  categoria: CategoriaResumen | null;
  custodio: { id: number; nombre: string } | null;
}

const PAGE_SIZE = 15;

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export default function BienesPage() {
  const [bienes, setBienes] = useState<BienListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [custodioId, setCustodioId] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [dadoDeBaja, setDadoDeBaja] = useState('');

  const [categorias, setCategorias] = useState<CategoriaResumen[]>([]);
  const [custodios, setCustodios] = useState<{ id: number; nombre: string }[]>([]);

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

  useEffect(() => {
    loadBienes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, categoriaId, custodioId, ubicacion, dadoDeBaja]);

  const loadBienes = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await inventarioBienesApi.findPage({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        categoriaId: categoriaId || undefined,
        custodioId: custodioId || undefined,
        ubicacion: ubicacion.trim() || undefined,
        dadoDeBaja: dadoDeBaja || undefined,
      });
      setBienes(result.data);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los bienes');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setPage(1);
    setSearch('');
    setCategoriaId('');
    setCustodioId('');
    setUbicacion('');
    setDadoDeBaja('');
  };

  const columns: DataTableColumn<BienListItem>[] = [
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
        <div className="flex items-center gap-2.5">
          <Avatar src={mediaUrl(row.fotoUrl)} name={row.descripcion} size="sm" />
          <span className="font-medium text-slate-900">
            {row.descripcion}
            {(row.marca || row.serie) && (
              <span className="block text-xs font-normal text-slate-600">
                {[row.marca, row.serie].filter(Boolean).join(' · ')}
              </span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      cell: (row) => (
        <span className="text-slate-600">{row.categoria?.nombre ?? '-'}</span>
      ),
    },
    {
      key: 'custodio',
      header: 'Custodio',
      cell: (row) => (
        <span className="text-slate-600">{row.custodio?.nombre ?? '-'}</span>
      ),
    },
    {
      key: 'ubicacion',
      header: 'Ubicación',
      cell: (row) => <span className="text-slate-600">{row.ubicacion || '-'}</span>,
    },
    {
      key: 'valorAdquisicion',
      header: 'Valor adq.',
      align: 'right',
      cell: (row) => (
        <span className="font-medium text-slate-700">
          {formatMoney(row.valorAdquisicion)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) =>
        row.dadoDeBaja ? (
          <Badge tone="danger">Dado de baja</Badge>
        ) : (
          <Badge tone="success">En uso</Badge>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      cellClassName: 'whitespace-nowrap',
      cell: (row) => (
        <Link
          href={`/inventario/bienes/${row.id}`}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-primary-600"
          title="Ver ficha"
        >
          <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bienes institucionales"
        subtitle="Inventario de propiedad, planta y equipo del GAD."
        actions={
          <Link
            href="/inventario/bienes/nuevo"
            className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Nuevo bien
          </Link>
        }
      />

      <Card padding="none">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Input
              type="search"
              placeholder="Código, descripción o serie"
              leftIcon={
                <Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              }
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
            <Select
              value={categoriaId}
              onChange={(e) => {
                setPage(1);
                setCategoriaId(e.target.value);
              }}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Select
              value={custodioId}
              onChange={(e) => {
                setPage(1);
                setCustodioId(e.target.value);
              }}
            >
              <option value="">Todos los custodios</option>
              {custodios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Input
              type="search"
              placeholder="Ubicación"
              value={ubicacion}
              onChange={(e) => {
                setPage(1);
                setUbicacion(e.target.value);
              }}
            />
            <Select
              value={dadoDeBaja}
              onChange={(e) => {
                setPage(1);
                setDadoDeBaja(e.target.value);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="false">Activos (en uso)</option>
              <option value="true">Dados de baja</option>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={clearFilters}
              leftIcon={<X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            >
              Limpiar
            </Button>
          </div>
        </div>

        {error && (
          <div className="border-t border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          rows={bienes}
          rowKey={(row) => row.id}
          loading={loading}
          empty={
            <EmptyState
              icon={
                <FolderX className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              }
              title="No hay bienes registrados."
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
