'use client';

import Link from 'next/link';
import { use } from 'react';

export default function PersonaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const persona = {
    id: id,
    nombre: 'Juan',
    apellido: 'Pérez',
    numeroIdentificacion: '1234567890',
    tipoIdentificacion: 'CED',
    email: 'juan.perez@email.com',
    telefono: '0999999999',
    direccion: 'Calle Principal, Ciudad',
    tipoPersona: 'Propietario',
    estado: true
  };

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>
              {persona.nombre} {persona.apellido}
            </h2>
            <p className="text-muted mb-0 small">Detalles de la persona</p>
          </div>
          <div className="d-flex gap-2">
            <Link href={`/personas/${persona.id}/edit`} className="btn btn-primary">
              <i className="ti ti-edit me-1"></i> Editar
            </Link>
            <Link href="/personas" className="btn btn-secondary">
              <i className="ti ti-arrow-left me-1"></i> Volver
            </Link>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Información Personal</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Tipo de Identificación</p>
                  <p className="fw-semibold mb-3">{persona.tipoIdentificacion}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Número de Identificación</p>
                  <p className="fw-semibold mb-3">{persona.numeroIdentificacion}</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Email</p>
                  <p className="fw-semibold mb-3">{persona.email || '-'}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Teléfono</p>
                  <p className="fw-semibold mb-3">{persona.telefono || '-'}</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <p className="text-muted mb-1 small">Dirección</p>
                  <p className="fw-semibold">{persona.direccion || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Tipo</h5>
            </div>
            <div className="card-body">
              <span className="badge badge-primary">{persona.tipoPersona}</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Acciones</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-2">
                <button className="btn btn-outline-primary w-100">
                  <i className="ti ti-user me-1"></i> Ver como Propietario
                </button>
                <button className="btn btn-outline-danger w-100">
                  <i className="ti ti-trash me-1"></i> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
