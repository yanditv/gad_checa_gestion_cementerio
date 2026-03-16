'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bloquesApi, cementeriosApi } from '@/lib/api';

export default function CreateBloquePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cementerios, setCementerios] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cementerioId: '',
    estado: true,
  });

  useEffect(() => {
    const loadCementerios = async () => {
      try {
        const data = await cementeriosApi.findAll();
        setCementerios(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, cementerioId: String(data[0].id) }));
        }
      } catch {
        setError('No se pudieron cargar los cementerios');
      }
    };

    loadCementerios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await bloquesApi.create({
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        cementerioId: Number(formData.cementerioId),
        estado: formData.estado,
      });
      router.push('/bloques');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el bloque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Nuevo Bloque</h2>
            <p className="text-muted mb-0 small">Registrar un nuevo bloque</p>
          </div>
          <Link href="/bloques" className="btn btn-secondary">
            <i className="ti ti-arrow-left me-1"></i> Volver
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Datos del Bloque</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Nombre *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Bloque A"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Cementerio *</label>
                      <select
                        className="form-select"
                        required
                        value={formData.cementerioId}
                        onChange={(e) => setFormData({ ...formData, cementerioId: e.target.value })}
                      >
                        <option value="">Seleccionar cementerio...</option>
                        {cementerios.map((cementerio) => (
                          <option key={cementerio.id} value={cementerio.id}>
                            {cementerio.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Descripción del bloque..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
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
                    Bloque activo
                  </label>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Link href="/bloques" className="btn btn-secondary">Cancelar</Link>
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
              <p className="text-muted small">Ingrese los datos del bloque. Los campos marcados con * son obligatorios.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
