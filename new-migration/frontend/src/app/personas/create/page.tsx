'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { personasApi } from '@/lib/api';

export default function CreatePersonaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    tipoIdentificacion: 'CED',
    numeroIdentificacion: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    genero: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await personasApi.create({
        ...formData,
        tipoPersona: 'Persona',
        fechaNacimiento: formData.fechaNacimiento || null,
      });
      router.push('/personas');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la persona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Nueva Persona</h2>
            <p className="text-muted mb-0 small">Registrar una nueva persona</p>
          </div>
          <Link href="/personas" className="btn btn-secondary">
            <i className="ti ti-arrow-left me-1"></i> Volver
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Datos de la Persona</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Tipo de Identificación *</label>
                      <select
                        className="form-select"
                        required
                        value={formData.tipoIdentificacion}
                        onChange={(e) => setFormData({ ...formData, tipoIdentificacion: e.target.value })}
                      >
                        <option value="CED">Cédula</option>
                        <option value="RUC">RUC</option>
                        <option value="PAS">Pasaporte</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Número de Identificación *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.numeroIdentificacion}
                        onChange={(e) => setFormData({ ...formData, numeroIdentificacion: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Nombres *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Apellidos *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.apellido}
                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  ></textarea>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fechaNacimiento}
                        onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Género</label>
                      <select
                        className="form-select"
                        value={formData.genero}
                        onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Link href="/personas" className="btn btn-secondary">Cancelar</Link>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <><span className="spinner" style={{ width: 16, height: 16 }}></span> Guardando...</> : <><i className="ti ti-check me-1"></i> Guardar</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Información</h5>
            </div>
            <div className="card-body">
              <p className="text-muted small">La persona puede ser registrada como:</p>
              <ul className="text-muted small" style={{ paddingLeft: '1rem' }}>
                <li><strong>Propietario:</strong> Dueño de una bóveda</li>
                <li><strong>Responsable:</strong> Persona de contacto</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
