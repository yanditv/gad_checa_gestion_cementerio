'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { personasApi } from '@/lib/api';

export default function EditPersonaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    const loadPersona = async () => {
      try {
        const persona = await personasApi.findOne(Number(params.id));
        setFormData({
          tipoIdentificacion: persona.tipoIdentificacion || 'CED',
          numeroIdentificacion: persona.numeroIdentificacion || '',
          nombre: persona.nombre || '',
          apellido: persona.apellido || '',
          email: persona.email || '',
          telefono: persona.telefono || '',
          direccion: persona.direccion || '',
          fechaNacimiento: persona.fechaNacimiento ? new Date(persona.fechaNacimiento).toISOString().split('T')[0] : '',
          genero: persona.genero || '',
        });
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la persona');
      } finally {
        setLoading(false);
      }
    };

    loadPersona();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await personasApi.update(Number(params.id), {
        ...formData,
        fechaNacimiento: formData.fechaNacimiento || null,
      });
      router.push(`/personas/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la persona');
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
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Editar Persona</h2>
            <p className="text-muted mb-0 small">Actualizar datos de la persona</p>
          </div>
          <Link href={`/personas/${params.id}`} className="btn btn-secondary">
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
              <Link href={`/personas/${params.id}`} className="btn btn-secondary">
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
