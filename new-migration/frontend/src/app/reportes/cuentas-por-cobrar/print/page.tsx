import { formatCurrency, formatDate } from '@/lib/contratos-server';
import { buildCuentasPorCobrarRows, CuentaPorCobrarRow, getReportesData } from '@/lib/reportes-server';
import { PrintActions } from '@/app/contratos/[id]/print/PrintActions';

export default async function CuentasPorCobrarPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const { autoprint } = await searchParams;
  const reportes = await getReportesData();
  const rows = buildCuentasPorCobrarRows(reportes);
  const totalPendiente = rows.reduce((sum: number, row: CuentaPorCobrarRow) => sum + row.monto, 0);

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
              <div className="fs-5 fw-bold mt-1">REPORTE DE CUENTAS POR COBRAR</div>
            </div>
          </div>
          <div className="text-end small">
            <div>Fecha: {formatDate(new Date())}</div>
            <div>Hora: {new Date().toLocaleTimeString('es-EC')}</div>
            <div className="fw-semibold">Cuentas por cobrar: {rows.length}</div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="border rounded p-3 bg-warning-subtle">
              <div className="small fw-semibold">CUENTAS POR COBRAR</div>
              <div className="fs-4 fw-bold">{rows.length}</div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border rounded p-3 bg-primary-subtle">
              <div className="small fw-semibold">MONTO POR COBRAR</div>
              <div className="fs-4 fw-bold">{formatCurrency(totalPendiente)}</div>
            </div>
          </div>
        </div>

        <table className="table table-bordered table-sm">
          <thead className="table-primary">
            <tr>
              <th>Contrato</th>
              <th>Responsable</th>
              <th>Telefono</th>
              <th>Difunto</th>
              <th>Ubicacion</th>
              <th>Fecha Venc.</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => {
                const vencida = row.fechaVencimiento && new Date(row.fechaVencimiento) < new Date();
                return (
                  <tr key={row.id}>
                    <td>{row.numeroContrato}</td>
                    <td>{row.responsable}</td>
                    <td>{row.telefono}</td>
                    <td>{row.difunto}</td>
                    <td>{row.ubicacion}</td>
                    <td className={vencida ? 'text-danger fw-bold' : ''}>{formatDate(row.fechaVencimiento)}</td>
                    <td>{formatCurrency(row.monto)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No hay cuentas por cobrar para mostrar en el reporte.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 ? (
            <tfoot>
              <tr className="table-primary">
                <th colSpan={6} className="text-end">TOTAL POR COBRAR:</th>
                <th>{formatCurrency(totalPendiente)}</th>
              </tr>
            </tfoot>
          ) : null}
        </table>

        <div className="text-center small text-muted mt-4">
          Generado por Sistema de Gestion de Cementerio - GAD Checa
        </div>
      </div>
    </div>
  );
}
