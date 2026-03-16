'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { bovedasApi, difuntosApi } from '@/lib/api';

export default function EditDifuntoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bovedas, setBovedas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    numeroIdentificacion: '',
    fechaNacimiento: '',
    edad: '',
    fechaDefuncion: '',
    fechaInhumacion: '',
    genero: '',
    causaMuerte: '',
    bovedaId: '',
    observaciones: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [difunto, bovedasData] = await Promise.all([
          difuntosApi.findOne(Number(params.id)),
          bovedasApi.findAll(),
        ]);

        setBovedas(bovedasData.filter((b: any) => b.estado));
        setFormData({
          nombre: difunto.nombre || '',
          apellido: difunto.apellido || '',
          numeroIdentificacion: difunto.numeroIdentificacion || '',
          fechaNacimiento: difunto.fechaNacimiento ? new Date(difunto.fechaNacimiento).toISOString().split('T')[0] : '',
          edad: difunto.edad?.toString() || '',
          fechaDefuncion: difunto.fechaDefuncion ? new Date(difunto.fechaDefuncion).toISOString().split('T')[0] : '',
          fechaInhumacion: difunto.fechaInhumacion ? new Date(difunto.fechaInhumacion).toISOString().split('T')[0] : '',
          genero: difunto.genero || '',
          causaMuerte: difunto.causaMuerte || '',
          bovedaId: difunto.bovedaId?.toString() || '',
          observaciones: difunto.observaciones || '',
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
      await difuntosApi.update(Number(params.id), {
        ...formData,
        edad: formData.edad ? Number(formData.edad) : null,
        bovedaId: Number(formData.bovedaId),
        fechaNacimiento: formData.fechaNacimiento || null,
        fechaDefuncion: formData.fechaDefuncion || null,
        fechaInhumacion: formData.fechaInhumacion || null,
      });
      router.push(`/difuntos/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el difunto');
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
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Editar Difunto</h2>
            <p className="text-muted mb-0 small">Actualizar datos del difunto</p>
          </div>
          <Link href={`/difuntos/${params.id}`} className="btn btn-secondary">
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
                  <label className="form-label">Número de Identificación</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.numeroIdentificacion}
                    onChange={(e) => setFormData({ ...formData, numeroIdentificacion: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Bóveda *</label>
                  <select
                    className="form-select"
                    required
                    value={formData.bovedaId}
                    onChange={(e) => setFormData({ ...formData, bovedaId: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {bovedas.map((boveda) => (
                      <option key={boveda.id} value={boveda.id}>
                        {boveda.numero} - {boveda.bloque?.nombre || 'Sin bloque'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
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
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Fecha de Defunción</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaDefuncion}
                    onChange={(e) => setFormData({ ...formData, fechaDefuncion: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Fecha de Inhumación</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaInhumacion}
                    onChange={(e) => setFormData({ ...formData, fechaInhumacion: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Edad</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.edad}
                    onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-4">
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
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Causa de Muerte</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.causaMuerte}
                    onChange={(e) => setFormData({ ...formData, causaMuerte: e.target.value })}
                  />
                </div>
              </div>
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
              <Link href={`/difuntos/${params.id}`} className="btn btn-secondary">
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
