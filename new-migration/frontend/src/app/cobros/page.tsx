'use client';

import { useEffect, useState } from 'react';
import { cuotasApi, pagosApi } from '@/lib/api';

export default function CobrosPage() {
  const [loading, setLoading] = useState(true);
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cuotas, pagosData] = await Promise.all([
          cuotasApi.pendientes(),
          pagosApi.findAll(),
        ]);
        setPendientes(cuotas);
        setPagos(pagosData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div className="container">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Cobros</h2>
        <p className="text-muted mb-0 small">Cuotas pendientes y últimos pagos registrados</p>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Cuotas Pendientes</h5>
            </div>
            <div className="card-body" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {pendientes.length === 0 && <p className="text-muted">No hay cuotas vencidas pendientes.</p>}
              {pendientes.map((cuota) => (
                <div key={cuota.id} className="mb-3 pb-3 border-bottom">
                  <div className="d-flex justify-content-between">
                    <strong>Cuota #{cuota.numero}</strong>
                    <span>${Number(cuota.monto).toFixed(2)}</span>
                  </div>
                  <small className="text-muted d-block">
                    {cuota.contrato?.difunto?.nombre} {cuota.contrato?.difunto?.apellido}
                  </small>
                  <small className="text-muted d-block">
                    Vence: {cuota.fechaVencimiento ? new Date(cuota.fechaVencimiento).toLocaleDateString() : '-'}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Últimos Pagos</h5>
            </div>
            <div className="card-body" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {pagos.length === 0 && <p className="text-muted">No hay pagos registrados.</p>}
              {pagos.slice(0, 20).map((pago) => (
                <div key={pago.id} className="mb-3 pb-3 border-bottom">
                  <div className="d-flex justify-content-between">
                    <strong>{pago.numeroRecibo}</strong>
                    <span>${Number(pago.monto).toFixed(2)}</span>
                  </div>
                  <small className="text-muted d-block">
                    {pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString() : '-'} - {pago.metodoPago}
                  </small>
                  <small className="text-muted d-block">{pago.referencia || 'Sin referencia'}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
