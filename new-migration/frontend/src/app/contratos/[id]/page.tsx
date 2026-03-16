import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  formatCurrency,
  formatDate,
  getContratoById,
  getContratoEstado,
} from '@/lib/contratos-server';

export default async function ContratoDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let contrato: any;
  try {
    contrato = await getContratoById(id);
  } catch {
    notFound();
  }

  const montoPagado = (contrato.cuotas || [])
    .filter((cuota: any) => cuota.pagada)
    .reduce((sum: number, cuota: any) => sum + Number(cuota.monto || 0), 0);

  const montoPendiente = (contrato.cuotas || [])
    .filter((cuota: any) => !cuota.pagada)
    .reduce((sum: number, cuota: any) => sum + Number(cuota.monto || 0), 0);

  const estadoContrato = getContratoEstado(contrato);

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>
              Contrato {contrato.numeroSecuencial}
            </h2>
            <p className="text-muted mb-0 small">Detalles completos del contrato</p>
          </div>
          <div className="d-flex gap-2">
            <a href={`/api/contratos/${id}/pdf`} className="btn btn-outline-primary" target="_blank" rel="noreferrer">
              <i className="ti ti-file-type-pdf me-1"></i> Ver PDF
            </a>
            <Link href={`/contratos/${id}/print`} className="btn btn-outline-primary" target="_blank">
              <i className="ti ti-printer me-1"></i> Vista imprimible
            </Link>
            <Link href={`/contratos/${id}/edit`} className="btn btn-primary">
              <i className="ti ti-edit me-1"></i> Editar
            </Link>
            <Link href="/contratos" className="btn btn-secondary">
              <i className="ti ti-arrow-left me-1"></i> Volver
            </Link>
          </div>
        </div>
      </div>

      <div className={`alert mb-4 ${estadoContrato === 'Activo' ? 'alert-success' : estadoContrato === 'Vencido' ? 'alert-warning' : 'alert-secondary'}`}>
        <i className={`ti me-2 ${estadoContrato === 'Activo' ? 'ti-check-circle' : estadoContrato === 'Vencido' ? 'ti-alert-circle' : 'ti-circle-off'}`}></i>
        <span>
          Contrato <strong>{estadoContrato.toLowerCase()}</strong>
          {contrato.fechaFin ? ` - Vigente hasta ${formatDate(contrato.fechaFin)}` : ''}
        </span>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Informacion del Contrato</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Numero de Contrato</p>
                  <p className="fw-semibold mb-3">{contrato.numeroSecuencial}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Estado</p>
                  <span className={`badge ${estadoContrato === 'Activo' ? 'bg-success' : estadoContrato === 'Vencido' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                    {estadoContrato}
                  </span>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Fecha de Inicio</p>
                  <p className="fw-semibold mb-3">{formatDate(contrato.fechaInicio)}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Fecha de Fin</p>
                  <p className="fw-semibold mb-3">{formatDate(contrato.fechaFin)}</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Monto Total</p>
                  <p className="fw-semibold mb-3">{formatCurrency(contrato.montoTotal)}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Tipo</p>
                  <span className={`badge ${contrato.esRenovacion ? 'bg-primary' : 'bg-info text-dark'}`}>
                    {contrato.esRenovacion ? 'Renovacion' : 'Nuevo'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-muted mb-1 small">Observaciones</p>
                <p className="fw-semibold mb-0">{contrato.observaciones || '-'}</p>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Boveda</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <p className="text-muted mb-1 small">Numero</p>
                  <p className="fw-semibold">{contrato.boveda?.numero || '-'}</p>
                </div>
                <div className="col-md-4">
                  <p className="text-muted mb-1 small">Bloque</p>
                  <p className="fw-semibold">{contrato.boveda?.bloque?.nombre || '-'}</p>
                </div>
                <div className="col-md-4">
                  <p className="text-muted mb-1 small">Tipo</p>
                  <p className="fw-semibold">{contrato.boveda?.tipo || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Difunto</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Nombre</p>
                  <p className="fw-semibold">
                    {contrato.difunto?.nombre || '-'} {contrato.difunto?.apellido || ''}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Identificacion</p>
                  <p className="fw-semibold">{contrato.difunto?.numeroIdentificacion || '-'}</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Fecha de Nacimiento</p>
                  <p className="fw-semibold">{formatDate(contrato.difunto?.fechaNacimiento)}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Fecha de Defuncion</p>
                  <p className="fw-semibold">{formatDate(contrato.difunto?.fechaDefuncion)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Responsables</h5>
            </div>
            <div className="card-body">
              {(contrato.responsables || []).length > 0 ? (
                <div className="row g-3">
                  {contrato.responsables.map((item: any) => {
                    const persona = item.responsable?.persona;
                    return (
                      <div className="col-md-6" key={item.id}>
                        <div className="border rounded p-3 h-100">
                          <div className="fw-semibold">
                            {persona?.nombre || '-'} {persona?.apellido || ''}
                          </div>
                          <div className="small text-muted">
                            {persona?.tipoIdentificacion || '-'}: {persona?.numeroIdentificacion || '-'}
                          </div>
                          <div className="small text-muted mt-1">
                            Parentesco: {item.responsable?.parentesco || '-'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mb-0 text-muted">Sin responsables registrados.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Cuotas</h5>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Monto</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th>Fecha de Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {(contrato.cuotas || []).map((cuota: any) => (
                    <tr key={cuota.id}>
                      <td>{cuota.numero}</td>
                      <td>{formatCurrency(cuota.monto)}</td>
                      <td>{formatDate(cuota.fechaVencimiento)}</td>
                      <td>
                        <span className={`badge ${cuota.pagada ? 'bg-success' : 'bg-danger'}`}>
                          {cuota.pagada ? 'Pagada' : 'Pendiente'}
                        </span>
                      </td>
                      <td>{formatDate(cuota.fechaPago)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Resumen de Pagos</h5>
            </div>
            <div className="card-body">
              <div className="stat-card mb-3" style={{ padding: '1rem' }}>
                <div className="avatar bg-light-success">
                  <i className="ti ti-check"></i>
                </div>
                <div>
                  <p className="text-muted mb-0 small">Pagado</p>
                  <p className="fw-semibold mb-0 text-success">{formatCurrency(montoPagado)}</p>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <div className="avatar bg-light-warning">
                  <i className="ti ti-clock"></i>
                </div>
                <div>
                  <p className="text-muted mb-0 small">Pendiente</p>
                  <p className="fw-semibold mb-0 text-warning">{formatCurrency(montoPendiente)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Acciones</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-2">
                <Link href={`/contratos/${id}/print`} className="btn btn-outline-primary w-100" target="_blank">
                  <i className="ti ti-printer me-1"></i> Vista imprimible
                </Link>
                <a href={`/api/contratos/${id}/pdf`} className="btn btn-outline-primary w-100" target="_blank" rel="noreferrer">
                  <i className="ti ti-file-type-pdf me-1"></i> Ver PDF real
                </a>
                <Link href={`/contratos/${id}/print?autoprint=1`} className="btn btn-outline-primary w-100" target="_blank">
                  <i className="ti ti-device-desktop me-1"></i> Imprimir desde navegador
                </Link>
                <Link href={`/contratos/${id}/edit`} className="btn btn-outline-primary w-100">
                  <i className="ti ti-edit me-1"></i> Editar contrato
                </Link>
                <Link href={`/contratos/create?contratoOrigenId=${id}`} className="btn btn-outline-primary w-100">
                  <i className="ti ti-copy me-1"></i> Renovar contrato
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
