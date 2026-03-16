'use client';

import Link from 'next/link';
import { use } from 'react';

export default function BovedaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const boveda = {
    id: id,
    numero: 'B001',
    tipo: 'Bóveda',
    capacidad: 4,
    estado: true,
    precio: 2500,
    precioArrendamiento: 800,
    ubicacion: 'Primera fila, lado izquierdo',
    observaciones: 'Bóveda en buen estado',
    bloque: { nombre: 'Bloque A', cementerio: { nombre: 'Cementerio Central' } },
    propietario: null,
    difuntos: [
      { id: 1, nombre: 'Pedro Gómez', fechaDefuncion: '2024-01-10' }
    ]
  };

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>
              Bóveda {boveda.numero}
            </h2>
            <p className="text-muted mb-0 small">{boveda.bloque.nombre} - {boveda.bloque.cementerio.nombre}</p>
          </div>
          <div className="d-flex gap-2">
            <Link href={`/bovedas/${boveda.id}/edit`} className="btn btn-primary">
              <i className="ti ti-edit me-1"></i> Editar
            </Link>
            <Link href="/bovedas" className="btn btn-secondary">
              <i className="ti ti-arrow-left me-1"></i> Volver
            </Link>
          </div>
        </div>
      </div>

      <div className="alert alert-success mb-4">
        <i className="ti ti-check-circle me-2"></i>
        <span>Bóveda <strong>disponible</strong> para arrendar</span>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Información de la Bóveda</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Número</p>
                  <p className="fw-semibold mb-3">{boveda.numero}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Tipo</p>
                  <p className="fw-semibold mb-3">{boveda.tipo}</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Capacidad</p>
                  <p className="fw-semibold mb-3">{boveda.capacidad} personas</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Estado</p>
                  <span className="badge badge-success">Disponible</span>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Precio de Venta</p>
                  <p className="fw-semibold mb-3">${boveda.precio.toFixed(2)}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Precio de Arrendamiento</p>
                  <p className="fw-semibold mb-3">${boveda.precioArrendamiento.toFixed(2)}</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <p className="text-muted mb-1 small">Ubicación</p>
                  <p className="fw-semibold mb-3">{boveda.ubicacion || '-'}</p>
                </div>
              </div>
              {boveda.observaciones && (
                <div className="row">
                  <div className="col-md-12">
                    <p className="text-muted mb-1 small">Observaciones</p>
                    <p className="fw-semibold">{boveda.observaciones}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {boveda.propietario !== null && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title">Propietario</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-12">
                    <p className="fw-semibold">{(boveda.propietario as any)?.persona?.nombre} {(boveda.propietario as any)?.persona?.apellido}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {boveda.difuntos.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Difuntos Enterrados</h5>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Fecha de Defunción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boveda.difuntos.map((difunto) => (
                      <tr key={difunto.id}>
                        <td>{difunto.nombre}</td>
                        <td>{difunto.fechaDefuncion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Acciones Rápidas</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-2">
                <Link href={`/contratos/create?boveda=${boveda.id}`} className="btn btn-primary w-100">
                  <i className="ti ti-file-plus me-1"></i> Crear Contrato
                </Link>
                <button className="btn btn-outline-primary w-100">
                  <i className="ti ti-user me-1"></i> Asignar Propietario
                </button>
                <button className="btn btn-outline-danger w-100">
                  <i className="ti ti-trash me-1"></i> Eliminar Bóveda
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Bloque</h5>
            </div>
            <div className="card-body">
              <p className="fw-semibold">{boveda.bloque.nombre}</p>
              <p className="text-muted small">{boveda.bloque.cementerio.nombre}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
