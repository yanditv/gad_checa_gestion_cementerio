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
import { listBovedasAction } from '@/app/actions/entity-actions';

interface Boveda {
  id: number;
  numero: string;
  capacidad: number;
  tipo: string | null;
  estado: boolean;
  precio: number;
  precioArrendamiento: number;
  bloque: { 
    nombre: string;
    cementerio: { nombre: string };
  };
  propietario: { 
    persona: { 
      nombre: string;
      apellido: string;
    };
  } | null;
}

export default function BovedasPage() {
  const [bovedas, setBovedas] = useState<Boveda[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadBovedas();
  }, [page, searchTerm, filterEstado]);

  const loadBovedas = async () => {
    setLoading(true);
    try {
      const result = await listBovedasAction({
        page,
        limit: 15,
        search: searchTerm.trim() || undefined,
      });
      let rows = result.data || [];
      if (filterEstado === 'disponible') rows = rows.filter((b: Boveda) => b.estado);
      if (filterEstado === 'ocupada') rows = rows.filter((b: Boveda) => !b.estado);
      setBovedas(rows);
      setMeta(result.meta);
    } catch (error) {
      console.log('Error loading bovedas');
    } finally {
      setLoading(false);
    }
  };

  const columns: DataGridColumn<Boveda>[] = [
    { key: 'numero', title: 'Número', render: (row) => <strong>{row.numero}</strong> },
    { key: 'bloque', title: 'Bloque', render: (row) => row.bloque?.nombre || '-' },
    { key: 'tipo', title: 'Tipo', render: (row) => row.tipo || 'Bóveda' },
    { key: 'capacidad', title: 'Capacidad', render: (row) => row.capacidad },
    {
      key: 'propietario',
      title: 'Propietario',
      render: (row) => (row.propietario ? `${row.propietario.persona.nombre} ${row.propietario.persona.apellido}` : '-'),
    },
    { key: 'precio', title: 'Precio', render: (row) => `$${Number(row.precio).toFixed(2)}` },
    { key: 'precioA', title: 'Precio Arriendo', render: (row) => `$${Number(row.precioArrendamiento).toFixed(2)}` },
    {
      key: 'estado',
      title: 'Estado',
      render: (row) => (row.estado ? <span className="badge badge-success">Disponible</span> : <span className="badge badge-danger">Ocupada</span>),
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (row) => (
        <div className="actions">
          <Link href={`/bovedas/${row.id}`} className="action-btn" title="Ver">
            <i className="ti ti-eye"></i>
          </Link>
          <Link href={`/bovedas/${row.id}/edit`} className="action-btn" title="Editar">
            <i className="ti ti-edit"></i>
          </Link>
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
        title="Lista de Bóvedas"
        subtitle="Administración de bóvedas y nichos"
        actions={<Button href="/bovedas/create" icon="ti-plus">Nueva Bóveda</Button>}
      />

      <div className="card">
        <SearchFilters>
          <div style={{ maxWidth: '320px', width: '100%' }}>
            <TextInput
              icon="ti-search"
              type="text"
              placeholder="Buscar bóvedas..."
              value={searchTerm}
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
              }}
            />
          </div>
          <SelectInput
            style={{ width: '200px' }}
            value={filterEstado}
            onChange={(e) => {
              setPage(1);
              setFilterEstado(e.target.value);
            }}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'disponible', label: 'Disponibles' },
              { value: 'ocupada', label: 'Ocupadas' },
            ]}
          />
        </SearchFilters>
        <DataGrid columns={columns} rows={bovedas} rowKey={(row) => row.id} loading={loading} emptyMessage="No hay bóvedas registradas" />
        <PaginationNav meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
