'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { bloquesApi, bovedasApi } from '@/lib/api';

export default function EditBovedaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const [boveda, bloquesData] = await Promise.all([
          bovedasApi.findOne(Number(params.id)),
          bloquesApi.findAll(),
        ]);

        setBloques(bloquesData.filter((b: any) => b.estado));
        setFormData({
          numero: boveda.numero || '',
          bloqueId: boveda.bloqueId?.toString() || '',
          tipo: boveda.tipo || 'Boveda',
          capacidad: boveda.capacidad?.toString() || '1',
          precio: boveda.precio?.toString() || '',
          precioArrendamiento: boveda.precioArrendamiento?.toString() || '',
          ubicacion: boveda.ubicacion || '',
          observaciones: boveda.observaciones || '',
          estado: !!boveda.estado,
        });
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await bovedasApi.update(Number(params.id), {
        ...formData,
        bloqueId: Number(formData.bloqueId),
        capacidad: Number(formData.capacidad),
        precio: Number(formData.precio || 0),
        precioArrendamiento: Number(formData.precioArrendamiento || 0),
      });
      router.push(`/bovedas/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la bóveda');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Editar Bóveda</h2>
            <p className="text-muted mb-0 small">Actualizar datos de la bóveda</p>
          </div>
          <Link href={`/bovedas/${params.id}`} className="btn btn-secondary">
            <i className="ti ti-arrow-left me-1"></i> Volver
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Número *</label>
                  <input
                    type="text"
                    className="form-control"
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
                    <option value="">Seleccionar...</option>
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
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select
                    className="form-select"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  >
                    <option value="Boveda">Bóveda</option>
                    <option value="Nicho">Nicho</option>
                    <option value="Mausoleo">Mausoleo</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Capacidad *</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    required
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select"
                    value={formData.estado ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value === 'true' })}
                  >
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Precio Arrendamiento</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
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
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Observaciones</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Link href={`/bovedas/${params.id}`} className="btn btn-secondary">
                Cancelar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
