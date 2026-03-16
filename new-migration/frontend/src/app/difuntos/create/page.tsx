'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bovedasApi, difuntosApi } from '@/lib/api';

export default function CreateDifuntoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
        const data = await bovedasApi.findAll();
        setBovedas(data.filter((b: any) => b.estado));
      } catch (err) {
        setBovedas([]);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await difuntosApi.create({
        ...formData,
        edad: formData.edad ? Number(formData.edad) : null,
        bovedaId: Number(formData.bovedaId),
        fechaNacimiento: formData.fechaNacimiento || null,
        fechaDefuncion: formData.fechaDefuncion || null,
        fechaInhumacion: formData.fechaInhumacion || null,
      });
      router.push('/difuntos');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el difunto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Nuevo Difunto</h2>
            <p className="text-muted mb-0 small">Registrar un nuevo difunto</p>
          </div>
          <Link href="/difuntos" className="btn btn-secondary">
            <i className="ti ti-arrow-left me-1"></i> Volver
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Datos del Difunto</h5>
            </div>
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
                      <label className="form-label">Tipo de Identificación</label>
                      <select className="form-select">
                        <option value="CED">Cédula</option>
                        <option value="RUC">RUC</option>
                        <option value="PAS">Pasaporte</option>
                      </select>
                    </div>
                  </div>
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
                      <label className="form-label">Edad</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.edad}
                        onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Fecha de Defunción *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.fechaDefuncion}
                        onChange={(e) => setFormData({ ...formData, fechaDefuncion: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Fecha de Inhumación *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.fechaInhumacion}
                        onChange={(e) => setFormData({ ...formData, fechaInhumacion: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
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
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Causa de Muerte</label>
                      <select
                        className="form-select"
                        value={formData.causaMuerte}
                        onChange={(e) => setFormData({ ...formData, causaMuerte: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="CA">Causa Natural</option>
                        <option value="AC">Accidente</option>
                        <option value="EN">Enfermedad</option>
                        <option value="OT">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Bóveda *</label>
                      <select
                        className="form-select"
                        required
                        value={formData.bovedaId}
                        onChange={(e) => setFormData({ ...formData, bovedaId: e.target.value })}
                      >
                        <option value="">Seleccionar bóveda...</option>
                        {bovedas.map((boveda) => (
                          <option key={boveda.id} value={boveda.id}>
                            {boveda.numero} - {boveda.bloque?.nombre || 'Sin bloque'}
                          </option>
                        ))}
                      </select>
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
                  <Link href="/difuntos" className="btn btn-secondary">Cancelar</Link>
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
              <p className="text-muted small">Complete los datos del difunto. Los campos marcados con * son obligatorios.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
