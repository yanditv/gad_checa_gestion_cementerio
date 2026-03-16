'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { contratosApi } from '@/lib/api';

interface Reportes {
  totalContratos: number;
  contratosActivos: number;
  contratosVencidos: number;
  ingresosTotales: number;
}

export default function ReportesPage() {
  const [reportes, setReportes] = useState<Reportes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportes();
  }, []);

  const loadReportes = async () => {
    try {
      const data = await contratosApi.getReportes();
      setReportes(data);
    } catch (error) {
      console.error('Error loading reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">Cargando...</div>;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '20px 0' }}>
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <h1 className="mb-1">Reportes</h1>
            <div className="small opacity-75">Resumen e impresion de reportes del sistema</div>
          </div>
          <div className="d-flex gap-2">
            <Link href="/reportes/ingresos/print" className="btn btn-light" target="_blank">
              Imprimir ingresos
            </Link>
            <Link href="/reportes/cuentas-por-cobrar/print" className="btn btn-outline-light" target="_blank">
              Cuentas por cobrar
            </Link>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div className="card">
            <h3 style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Total Contratos</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>
              {reportes?.totalContratos || 0}
            </p>
          </div>

          <div className="card">
            <h3 style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Contratos Activos</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px', color: '#16a34a' }}>
              {reportes?.contratosActivos || 0}
            </p>
          </div>

          <div className="card">
            <h3 style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Contratos Vencidos</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px', color: '#dc2626' }}>
              {reportes?.contratosVencidos || 0}
            </p>
          </div>

          <div className="card">
            <h3 style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Ingresos Totales</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px', color: '#2563eb' }}>
              ${Number(reportes?.ingresosTotales || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-body">
            <h2 className="mb-2">Reportes disponibles</h2>
            <p style={{ color: '#64748b' }}>
              Sistema de gestión de cementerio - GAD Checa
            </p>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <Link href="/reportes/ingresos/print" className="btn btn-primary" target="_blank">
                Abrir reporte de ingresos
              </Link>
              <Link href="/reportes/ingresos/print?autoprint=1" className="btn btn-outline-primary" target="_blank">
                Imprimir ingresos
              </Link>
              <Link href="/reportes/cuentas-por-cobrar/print" className="btn btn-warning" target="_blank">
                Abrir cuentas por cobrar
              </Link>
              <Link href="/reportes/cuentas-por-cobrar/print?autoprint=1" className="btn btn-outline-warning" target="_blank">
                Imprimir cuentas por cobrar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
