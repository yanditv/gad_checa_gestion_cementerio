import { formatCurrency, formatDate } from '@/lib/contratos-server';
import { buildIngresosRows, getReportesData, IngresoRow } from '@/lib/reportes-server';
import { PrintActions } from '@/app/contratos/[id]/print/PrintActions';

export default async function IngresosPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const { autoprint } = await searchParams;
  const reportes = await getReportesData();
  const rows = buildIngresosRows(reportes);
  const totalIngresos = rows.reduce((sum: number, row: IngresoRow) => sum + row.monto, 0);
  const promedio = rows.length ? totalIngresos / rows.length : 0;

  return (
    <div className="container py-4">
      <PrintActions backHref="/reportes" autoPrint={autoprint === '1'} />

      <div className="bg-white text-dark p-4 shadow-sm border rounded">
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
          <div className="d-flex align-items-center gap-3">
            <img src="/images/logo.jpeg" alt="GAD Checa" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
            <div>
              <div className="fw-bold">GOBIERNO AUTONOMO DESCENTRALIZADO</div>
              <div className="fw-bold">PARROQUIAL DE CHECA</div>
              <div className="fs-5 fw-bold mt-1">REPORTE DE INGRESOS POR FECHA</div>
            </div>
          </div>
          <div className="text-end small">
            <div>Fecha: {formatDate(new Date())}</div>
            <div>Hora: {new Date().toLocaleTimeString('es-EC')}</div>
            <div className="fw-semibold">Total Registros: {rows.length}</div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="border rounded p-3 bg-success-subtle">
              <div className="small fw-semibold">TOTAL INGRESOS</div>
              <div className="fs-4 fw-bold">{formatCurrency(totalIngresos)}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="border rounded p-3 bg-primary-subtle">
              <div className="small fw-semibold">PROMEDIO POR PAGO</div>
              <div className="fs-4 fw-bold">{formatCurrency(promedio)}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="border rounded p-3 bg-light">
              <div className="small fw-semibold">TOTAL REGISTROS</div>
              <div className="fs-4 fw-bold">{rows.length}</div>
            </div>
          </div>
        </div>

        <table className="table table-bordered table-sm">
          <thead className="table-primary">
            <tr>
              <th>Fecha</th>
              <th>Tipo Pago</th>
              <th>Boveda</th>
              <th>Pagado Por</th>
              <th>Contrato</th>
              <th>Comprobante</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.fechaPago)}</td>
                  <td>{row.tipoPago}</td>
                  <td>{row.bloque} / {row.boveda}</td>
                  <td>{row.pagadoPor}</td>
                  <td>{row.numeroContrato}</td>
                  <td>{row.numeroComprobante}</td>
                  <td>{formatCurrency(row.monto)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No hay ingresos para mostrar en el reporte.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="text-center small text-muted mt-4">
          Generado por Sistema de Gestion de Cementerio - GAD Checa
        </div>
      </div>
    </div>
  );
}
