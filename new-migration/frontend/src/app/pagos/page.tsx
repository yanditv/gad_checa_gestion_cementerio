'use client';

import { useEffect, useState } from 'react';
import { pagosApi } from '@/lib/api';

interface Pago {
  id: number;
  numeroRecibo: string;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  referencia: string | null;
  estado: boolean;
  cuotas: { cuota: { contrato: { difunto: { nombre: string; apellido: string } } } }[];
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPagos();
  }, []);

  const loadPagos = async () => {
    try {
      const data = await pagosApi.findAll();
      setPagos(data);
    } catch (error) {
      console.error('Error loading pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">Cargando...</div>;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '20px 0' }}>
        <div className="container">
          <h1>Pagos</h1>
        </div>
      </header>

      <div className="container" style={{ padding: '20px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2>Lista de Pagos</h2>
            <button className="btn btn-primary">Nuevo Pago</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Recibo</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Beneficiario</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Monto</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Método</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago) => (
                <tr key={pago.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{pago.numeroRecibo}</td>
                  <td style={{ padding: '10px' }}>{new Date(pago.fechaPago).toLocaleDateString()}</td>
                  <td style={{ padding: '10px' }}>
                    {pago.cuotas[0]?.cuota.contrato.difunto.nombre} {pago.cuotas[0]?.cuota.contrato.difunto.apellido}
                  </td>
                  <td style={{ padding: '10px' }}>${Number(pago.monto).toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>{pago.metodoPago}</td>
                  <td style={{ padding: '10px' }}>{pago.referencia || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagos.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No hay pagos registrados
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
