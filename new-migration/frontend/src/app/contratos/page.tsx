'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DataGrid, DataGridColumn } from '@/components/ui/DataGrid';
import { PaginationNav } from '@/components/ui/PaginationNav';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { PageHeader } from '@/components/ui/PageHeader';
import { PaginationMeta } from '@/lib/api';

interface Contrato {
  id: number;
  numeroSecuencial: string;
  fechaInicio: string;
  fechaFin: string | null;
  montoTotal: number;
  estado: boolean;
  esRenovacion: boolean;
  boveda: { 
    numero: string;
    bloque: { nombre: string };
  };
  difunto: { 
    nombre: string; 
    apellido: string;
    numeroIdentificacion: string | null;
  };
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    loadContratos();
  }, [page, searchTerm]);

  const loadContratos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const response = await fetch(`/api/contratos?${params.toString()}`);
      if (response.ok) {
        const payload = await response.json();
        setContratos(payload.data || []);
        setMeta(payload.meta);
      }
    } catch (error) {
      console.log('Error loading contratos');
    } finally {
      setLoading(false);
    }
  };

  const columns: DataGridColumn<Contrato>[] = [
    { key: 'numero', title: 'Número', render: (row) => <strong>{row.numeroSecuencial}</strong> },
    { key: 'difunto', title: 'Difunto', render: (row) => `${row.difunto?.nombre || ''} ${row.difunto?.apellido || ''}` },
    { key: 'identificacion', title: 'Identificación', render: (row) => row.difunto?.numeroIdentificacion || '-' },
    { key: 'boveda', title: 'Bóveda', render: (row) => `${row.boveda?.numero || '-'} - ${row.boveda?.bloque?.nombre || '-'}` },
    { key: 'monto', title: 'Monto Total', render: (row) => `$${Number(row.montoTotal).toFixed(2)}` },
    { key: 'inicio', title: 'Fecha Inicio', render: (row) => (row.fechaInicio ? new Date(row.fechaInicio).toLocaleDateString() : '-') },
    { key: 'fin', title: 'Fecha Fin', render: (row) => (row.fechaFin ? new Date(row.fechaFin).toLocaleDateString() : '-') },
    {
      key: 'tipo',
      title: 'Tipo',
      render: (row) =>
        row.esRenovacion ? <span className="badge badge-info">Renovación</span> : <span className="badge badge-primary">Nuevo</span>,
    },
    {
      key: 'estado',
      title: 'Estado',
      render: (row) =>
        row.estado ? <span className="badge badge-success">Activo</span> : <span className="badge badge-danger">Inactivo</span>,
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (row) => (
        <div className="actions">
          <Link href={`/contratos/${row.id}`} className="action-btn" title="Ver">
            <i className="ti ti-eye"></i>
          </Link>
          <Link href={`/contratos/${row.id}/edit`} className="action-btn" title="Editar">
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
        title="Lista de Contratos"
        subtitle="Gestión de contratos de arrendamiento"
        actions={<Button href="/contratos/create" icon="ti-plus">Nuevo Contrato</Button>}
      />

      <div className="card">
        <SearchFilters>
          <div style={{ maxWidth: '320px', width: '100%' }}>
            <TextInput
              icon="ti-search"
              type="text"
              placeholder="Buscar contratos..."
              value={searchTerm}
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
              }}
            />
          </div>
        </SearchFilters>
        <DataGrid columns={columns} rows={contratos} rowKey={(row) => row.id} loading={loading} emptyMessage="No hay contratos registrados" />
        <PaginationNav meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
