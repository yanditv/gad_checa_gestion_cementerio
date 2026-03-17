'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PaginationMeta } from '@/lib/api';
import { DataGrid, DataGridColumn } from '@/components/ui/DataGrid';
import { PaginationNav } from '@/components/ui/PaginationNav';
import { TextInput } from '@/components/ui/TextInput';
import { SelectInput } from '@/components/ui/SelectInput';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { listPersonasAction } from '@/app/actions/entity-actions';

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  numeroIdentificacion: string;
  email: string | null;
  telefono: string | null;
  tipoPersona: string;
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadPersonas();
  }, [tipo, page, search]);

  const loadPersonas = async () => {
    setLoading(true);
    try {
      const result = await listPersonasAction({
        page,
        limit: 15,
        search,
        type: tipo || undefined,
      });
      setPersonas(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error('Error loading personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: DataGridColumn<Persona>[] = [
    { key: 'nombre', title: 'Nombre', render: (row) => `${row.nombre} ${row.apellido}` },
    { key: 'identificacion', title: 'Identificación', render: (row) => row.numeroIdentificacion },
    { key: 'email', title: 'Email', render: (row) => row.email || '-' },
    { key: 'telefono', title: 'Teléfono', render: (row) => row.telefono || '-' },
    { key: 'tipo', title: 'Tipo', render: (row) => row.tipoPersona },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (row) => (
        <div className="actions">
          <Link href={`/personas/${row.id}`} className="action-btn" title="Ver">
            <i className="ti ti-eye"></i>
          </Link>
          <Link href={`/personas/${row.id}/edit`} className="action-btn" title="Editar">
            <i className="ti ti-edit"></i>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lista de Personas"
        subtitle="Gestión de propietarios y responsables"
        actions={<Button href="/personas/create" icon="ti-plus">Nueva Persona</Button>}
      />

      <div className="card">
        <SearchFilters>
          <div style={{ maxWidth: '320px', width: '100%' }}>
            <TextInput
              icon="ti-search"
              type="text"
              placeholder="Buscar personas..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <SelectInput
            style={{ width: '220px' }}
            value={tipo}
            onChange={(e) => {
              setPage(1);
              setTipo(e.target.value);
            }}
            options={[
              { value: '', label: 'Todos los tipos' },
              { value: 'Propietario', label: 'Propietarios' },
              { value: 'Responsable', label: 'Responsables' },
            ]}
          />
        </SearchFilters>

        <DataGrid columns={columns} rows={personas} rowKey={(row) => row.id} loading={loading} emptyMessage="No hay personas registradas" />
        <PaginationNav meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
