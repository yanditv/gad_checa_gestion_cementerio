'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PaginationMeta } from '@/lib/api';
import { DataGrid, DataGridColumn } from '@/components/ui/DataGrid';
import { PaginationNav } from '@/components/ui/PaginationNav';
import { TextInput } from '@/components/ui/TextInput';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { listDifuntosAction } from '@/app/actions/entity-actions';

interface Difunto {
  id: number;
  nombre: string;
  apellido: string;
  numeroIdentificacion: string | null;
  fechaNacimiento: string | null;
  fechaDefuncion: string | null;
  fechaInhumacion: string | null;
  causaMuerte: string | null;
  estado: boolean;
  boveda: { numero: string; bloque: { nombre: string } };
}

export default function DifuntosPage() {
  const [difuntos, setDifuntos] = useState<Difunto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadDifuntos();
  }, [page, search]);

  const loadDifuntos = async () => {
    setLoading(true);
    try {
      const result = await listDifuntosAction({ page, limit: 15, search });
      setDifuntos(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error('Error loading difuntos:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: DataGridColumn<Difunto>[] = [
    {
      key: 'nombre',
      title: 'Nombre',
      render: (row) => `${row.nombre} ${row.apellido}`,
    },
    { key: 'identificacion', title: 'Identificación', render: (row) => row.numeroIdentificacion || '-' },
    {
      key: 'defuncion',
      title: 'Fecha Defunción',
      render: (row) => (row.fechaDefuncion ? new Date(row.fechaDefuncion).toLocaleDateString() : '-'),
    },
    { key: 'boveda', title: 'Bóveda', render: (row) => `${row.boveda?.numero || '-'} - ${row.boveda?.bloque?.nombre || '-'}` },
    { key: 'causa', title: 'Causa Muerte', render: (row) => row.causaMuerte || '-' },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (row) => (
        <div className="actions">
          <Link href={`/difuntos/${row.id}`} className="action-btn" title="Ver">
            <i className="ti ti-eye"></i>
          </Link>
          <Link href={`/difuntos/${row.id}/edit`} className="action-btn" title="Editar">
            <i className="ti ti-edit"></i>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lista de Difuntos"
        subtitle="Gestión de difuntos registrados"
        actions={<Button href="/difuntos/create" icon="ti-plus">Nuevo Difunto</Button>}
      />

      <div className="card">
        <SearchFilters>
          <div style={{ maxWidth: '320px', width: '100%' }}>
            <TextInput
              icon="ti-search"
              type="text"
              placeholder="Buscar difuntos..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </SearchFilters>
        <DataGrid columns={columns} rows={difuntos} rowKey={(row) => row.id} loading={loading} emptyMessage="No hay difuntos registrados" />
        <PaginationNav meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
