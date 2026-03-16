'use client';

import Link from 'next/link';
import { use } from 'react';

export default function DifuntoDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const difunto = {
    id: id,
    nombre: 'Juan',
    apellido: 'Pérez',
    numeroIdentificacion: '1234567890',
    fechaNacimiento: '1950-05-15',
    fechaDefuncion: '2024-01-10',
    fechaInhumacion: '2024-01-12',
    causaMuerte: 'Causa Natural',
    edad: 73,
    genero: 'Masculino',
    estado: true,
    boveda: { numero: 'B001', bloque: { nombre: 'Bloque A' } }
  };

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>
              {difunto.nombre} {difunto.apellido}
            </h2>
            <p className="text-muted mb-0 small">Detalles del difunto</p>
          </div>
          <div className="d-flex gap-2">
            <Link href={`/difuntos/${difunto.id}/edit`} className="btn btn-primary">
              <i className="ti ti-edit me-1"></i> Editar
            </Link>
            <Link href="/difuntos" className="btn btn-secondary">
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
                  <p className="text-muted mb-1 small">Identificación</p>
                  <p className="fw-semibold mb-3">{difunto.numeroIdentificacion || '-'}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Edad</p>
                  <p className="fw-semibold mb-3">{difunto.edad} años</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Género</p>
                  <p className="fw-semibold mb-3">{difunto.genero}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Causa de Muerte</p>
                  <p className="fw-semibold mb-3">{difunto.causaMuerte}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Fechas</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <p className="text-muted mb-1 small">Fecha de Nacimiento</p>
                  <p className="fw-semibold mb-3">{difunto.fechaNacimiento || '-'}</p>
                </div>
                <div className="col-md-4">
                  <p className="text-muted mb-1 small">Fecha de Defunción</p>
                  <p className="fw-semibold mb-3">{difunto.fechaDefuncion}</p>
                </div>
                <div className="col-md-4">
                  <p className="text-muted mb-1 small">Fecha de Inhumación</p>
                  <p className="fw-semibold mb-3">{difunto.fechaInhumacion}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Ubicación</h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-1 small">Bóveda</p>
              <p className="fw-semibold">{difunto.boveda.numero}</p>
              <p className="text-muted mb-1 small">Bloque</p>
              <p className="fw-semibold">{difunto.boveda.bloque.nombre}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Acciones</h5>
            </div>
            <div className="card-body">
              <button className="btn btn-outline-danger w-100">
                <i className="ti ti-trash me-1"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
