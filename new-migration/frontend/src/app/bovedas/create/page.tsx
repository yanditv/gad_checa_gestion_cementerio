'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bloquesApi, bovedasApi } from '@/lib/api';

export default function CreateBovedaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bloques, setBloques] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    numero: '',
    bloqueId: '',
    tipo: 'Boveda',
    capacidad: '1',
    precio: '',
    precioArrendamiento: '',
    ubicacion: '',
    observaciones: '',
    estado: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await bloquesApi.findAll();
        setBloques(data.filter((b: any) => b.estado));
      } catch (err) {
        setBloques([]);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await bovedasApi.create({
        ...formData,
        bloqueId: Number(formData.bloqueId),
        capacidad: Number(formData.capacidad),
        precio: Number(formData.precio || 0),
        precioArrendamiento: Number(formData.precioArrendamiento || 0),
      });
      router.push('/bovedas');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la bóveda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Nueva Bóveda</h2>
            <p className="text-muted mb-0 small">Registrar una nueva bóveda</p>
          </div>
          <Link href="/bovedas" className="btn btn-secondary">
            <i className="ti ti-arrow-left me-1"></i> Volver
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Datos de la Bóveda</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Número de Bóveda *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: B001"
                        required
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Bloque *</label>
                      <select
                        className="form-select"
                        required
                        value={formData.bloqueId}
                        onChange={(e) => setFormData({ ...formData, bloqueId: e.target.value })}
                      >
                        <option value="">Seleccionar bloque...</option>
                        {bloques.map((bloque) => (
                          <option key={bloque.id} value={bloque.id}>
                            {bloque.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Tipo *</label>
                      <select
                        className="form-select"
                        required
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      >
                        <option value="Boveda">Bóveda</option>
                        <option value="Nicho">Nicho</option>
                        <option value="Mausoleo">Mausoleo</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Capacidad *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Número de cuerpos"
                        min="1"
                        required
                        value={formData.capacidad}
                        onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Precio de Venta</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        step="0.01"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Precio de Arrendamiento</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        step="0.01"
                        value={formData.precioArrendamiento}
                        onChange={(e) => setFormData({ ...formData, precioArrendamiento: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ubicación</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Descripción de la ubicación"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      className="form-check-input me-2"
                      checked={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                    />
                    Bóveda disponible para arrendar
                  </label>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Link href="/bovedas" className="btn btn-secondary">Cancelar</Link>
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
              <p className="text-muted small">Ingrese los datos de la bóveda. Los campos marcados con * son obligatorios.</p>
              <hr />
              <p className="text-muted small mb-2"><strong>Tipos de espacio:</strong></p>
              <ul className="text-muted small" style={{ paddingLeft: '1rem' }}>
                <li><strong>Bóveda:</strong> Espacio tradicional para entierro</li>
                <li><strong>Nicho:</strong> Espacio reducido para cenizas</li>
                <li><strong>Mausoleo:</strong> Construcción privada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
