'use client';

import { useEffect, useState } from 'react';
import { DataGrid, DataGridColumn } from '@/components/ui/DataGrid';
import { PaginationNav } from '@/components/ui/PaginationNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { PaginationMeta } from '@/lib/api';
import { listBloquesAction } from '@/app/actions/entity-actions';

interface Bloque {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  cementerioId: number;
}

export default function BloquesPage() {
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadBloques();
  }, [page, search]);

  const loadBloques = async () => {
    setLoading(true);
    try {
      const result = await listBloquesAction({
        page,
        limit: 15,
        search: search.trim() || undefined,
      });
      setBloques(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.log('Error loading bloques');
    } finally {
      setLoading(false);
    }
  };

  const columns: DataGridColumn<Bloque>[] = [
    { key: 'nombre', title: 'Nombre', render: (row) => <strong>{row.nombre}</strong> },
    { key: 'descripcion', title: 'Descripción', render: (row) => row.descripcion || '-' },
    {
      key: 'estado',
      title: 'Estado',
      render: (row) => (row.estado ? <span className="badge badge-success">Activo</span> : <span className="badge badge-danger">Inactivo</span>),
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: () => (
        <div className="actions">
          <button className="action-btn" title="Ver">
            <i className="ti ti-eye"></i>
          </button>
          <button className="action-btn" title="Editar">
            <i className="ti ti-edit"></i>
          </button>
          <button className="action-btn danger" title="Eliminar">
            <i className="ti ti-trash"></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lista de Bloques"
        subtitle="Administración de bloques del cementerio"
        actions={<Button href="/bloques/create" icon="ti-plus">Nuevo Bloque</Button>}
      />

      <div className="card">
        <SearchFilters>
          <div style={{ maxWidth: '320px', width: '100%' }}>
            <TextInput
              icon="ti-search"
              type="text"
              placeholder="Buscar bloques..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </SearchFilters>
        <DataGrid columns={columns} rows={bloques} rowKey={(row) => row.id} loading={loading} emptyMessage="No hay bloques registrados" />
        <PaginationNav meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
