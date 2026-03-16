'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { bovedasApi, contratosApi, difuntosApi } from '@/lib/api';

export default function EditContratoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bovedas, setBovedas] = useState<any[]>([]);
  const [difuntos, setDifuntos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    bovedaId: '',
    difuntoId: '',
    fechaInicio: '',
    fechaFin: '',
    numeroDeMeses: '12',
    montoTotal: '',
    observaciones: '',
    estado: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [contrato, bovedasData, difuntosData] = await Promise.all([
          contratosApi.findOne(Number(params.id)),
          bovedasApi.findAll(),
          difuntosApi.findAll(),
        ]);

        setBovedas(bovedasData.filter((item: any) => item.estado));
        setDifuntos(difuntosData.filter((item: any) => item.estado));

        setFormData({
          bovedaId: contrato.bovedaId?.toString() || '',
          difuntoId: contrato.difuntoId?.toString() || '',
          fechaInicio: contrato.fechaInicio ? new Date(contrato.fechaInicio).toISOString().split('T')[0] : '',
          fechaFin: contrato.fechaFin ? new Date(contrato.fechaFin).toISOString().split('T')[0] : '',
          numeroDeMeses: contrato.numeroDeMeses?.toString() || '12',
          montoTotal: contrato.montoTotal?.toString() || '',
          observaciones: contrato.observaciones || '',
          estado: !!contrato.estado,
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
      await contratosApi.update(Number(params.id), {
        bovedaId: Number(formData.bovedaId),
        difuntoId: Number(formData.difuntoId),
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin || null,
        numeroDeMeses: Number(formData.numeroDeMeses),
        montoTotal: Number(formData.montoTotal),
        observaciones: formData.observaciones || null,
        estado: formData.estado,
      });
      router.push(`/contratos/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el contrato');
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
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Editar Contrato</h2>
            <p className="text-muted mb-0 small">Actualizar contrato de arrendamiento</p>
          </div>
          <Link href={`/contratos/${params.id}`} className="btn btn-secondary">
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
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Difunto *</label>
                  <select
                    className="form-select"
                    required
                    value={formData.difuntoId}
                    onChange={(e) => setFormData({ ...formData, difuntoId: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {difuntos.map((difunto) => (
                      <option key={difunto.id} value={difunto.id}>
                        {difunto.nombre} {difunto.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-3">
                <div className="form-group">
                  <label className="form-label">Fecha Inicio *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label className="form-label">Fecha Fin</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label className="form-label">Meses *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    required
                    value={formData.numeroDeMeses}
                    onChange={(e) => setFormData({ ...formData, numeroDeMeses: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select"
                    value={formData.estado ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value === 'true' })}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Monto Total *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                required
                value={formData.montoTotal}
                onChange={(e) => setFormData({ ...formData, montoTotal: e.target.value })}
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
              <Link href={`/contratos/${params.id}`} className="btn btn-secondary">
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
