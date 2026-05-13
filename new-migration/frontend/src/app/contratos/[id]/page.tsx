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
  const propietario = contrato.boveda?.propietario?.persona;
  const contratosHijos: any[] = contrato.contratosHijos || [];
  const contratoOrigen = contrato.contratoOrigen;
  const contratoRelacionado = contrato.contratoRelacionado;

  // Recibos únicos: agrupa cuotas pagadas por su Pago (numeroRecibo).
  const recibos = (() => {
    const map = new Map<number, any>();
    for (const cuota of contrato.cuotas || []) {
      for (const cp of cuota.pagos || []) {
        const pago = cp.pago;
        if (!pago) continue;
        if (!map.has(pago.id)) {
          map.set(pago.id, { ...pago, cuotas: [] as any[] });
        }
        map.get(pago.id).cuotas.push(cuota);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime(),
    );
  })();

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2
              style={{
                marginBottom: '0.25rem',
                fontSize: '1.5rem',
                fontWeight: 600,
              }}
            >
              Contrato {contrato.numeroSecuencial}
            </h2>
            <p className="text-muted mb-0 small">
              Detalles completos del contrato
            </p>
          </div>
          <div className="d-flex gap-2">
            <a
              href={`/api/contratos/${id}/pdf`}
              className="btn btn-outline-primary"
              target="_blank"
              rel="noreferrer"
            >
              <i className="ti ti-file-type-pdf me-1"></i> Ver PDF
            </a>
            <Link
              href={`/contratos/${id}/print`}
              className="btn btn-outline-primary"
              target="_blank"
            >
              <i className="ti ti-printer me-1"></i> Vista imprimible
            </Link>
            <Link
              href={`/contratos/${id}/edit`}
              className="btn btn-primary"
            >
              <i className="ti ti-edit me-1"></i> Editar
            </Link>
            <Link href="/contratos" className="btn btn-secondary">
              <i className="ti ti-arrow-left me-1"></i> Volver
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`alert mb-4 ${
          estadoContrato === 'Activo'
            ? 'alert-success'
            : estadoContrato === 'Vencido'
              ? 'alert-warning'
              : 'alert-secondary'
        }`}
      >
        <i
          className={`ti me-2 ${
            estadoContrato === 'Activo'
              ? 'ti-circle-check'
              : estadoContrato === 'Vencido'
                ? 'ti-alert-circle'
                : 'ti-circle-off'
          }`}
        ></i>
        <span>
          Contrato <strong>{estadoContrato.toLowerCase()}</strong>
          {contrato.fechaFin
            ? ` — vigente hasta ${formatDate(contrato.fechaFin)}`
            : ''}
        </span>
      </div>

      <div className="row">
        <div className="col-md-8">
          {/* ----- Información del contrato ----- */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Información del contrato</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Número de contrato</p>
                  <p className="fw-semibold mb-3">
                    {contrato.numeroSecuencial}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Estado</p>
                  <span
                    className={`badge ${
                      estadoContrato === 'Activo'
                        ? 'bg-success'
                        : estadoContrato === 'Vencido'
                          ? 'bg-warning text-dark'
                          : 'bg-secondary'
                    }`}
                  >
                    {estadoContrato}
                  </span>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Fecha de inicio</p>
                  <p className="fw-semibold mb-3">
                    {formatDate(contrato.fechaInicio)}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Fecha de fin</p>
                  <p className="fw-semibold mb-3">
                    {formatDate(contrato.fechaFin)}
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Monto total</p>
                  <p className="fw-semibold mb-3">
                    {formatCurrency(contrato.montoTotal)}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Tipo</p>
                  <span
                    className={`badge ${
                      contrato.esRenovacion
                        ? 'bg-info-subtle text-info'
                        : 'bg-primary-subtle text-primary'
                    }`}
                  >
                    {contrato.esRenovacion ? 'Renovación' : 'Nuevo'}
                  </span>
                  {contrato.vecesRenovado > 0 && (
                    <span className="badge bg-light-secondary text-secondary ms-2">
                      Renovado {contrato.vecesRenovado}×
                    </span>
                  )}
                </div>
              </div>
              {contrato.descuento && (
                <div className="row">
                  <div className="col-md-6">
                    <p className="text-muted mb-1 small">Descuento aplicado</p>
                    <p className="fw-semibold mb-3">
                      {contrato.descuento.nombre} —{' '}
                      {Number(contrato.descuento.porcentaje)}%
                    </p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-muted mb-1 small">Observaciones</p>
                <p className="fw-semibold mb-0">
                  {contrato.observaciones || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* ----- Bóveda ----- */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Bóveda</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <p className="text-muted mb-1 small">Número</p>
                  <p className="fw-semibold">{contrato.boveda?.numero || '-'}</p>
                </div>
                <div className="col-md-3">
                  <p className="text-muted mb-1 small">Bloque</p>
                  <p className="fw-semibold">
                    {contrato.boveda?.bloque?.nombre || '-'}
                  </p>
                </div>
                <div className="col-md-3">
                  <p className="text-muted mb-1 small">Piso</p>
                  <p className="fw-semibold">
                    {contrato.boveda?.piso?.numero ?? '-'}
                  </p>
                </div>
                <div className="col-md-3">
                  <p className="text-muted mb-1 small">Tipo</p>
                  <p className="fw-semibold">{contrato.boveda?.tipo || '-'}</p>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Propietario</p>
                  <p className="fw-semibold">
                    {propietario
                      ? `${propietario.nombre} ${propietario.apellido}`
                      : 'Sin propietario asignado'}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Cementerio</p>
                  <p className="fw-semibold">
                    {contrato.boveda?.bloque?.cementerio?.nombre || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ----- Difunto ----- */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Difunto</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Nombre</p>
                  <p className="fw-semibold">
                    {contrato.difunto?.nombre || '-'}{' '}
                    {contrato.difunto?.apellido || ''}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Identificación</p>
                  <p className="fw-semibold">
                    {contrato.difunto?.numeroIdentificacion || '-'}
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Fecha de nacimiento</p>
                  <p className="fw-semibold">
                    {formatDate(contrato.difunto?.fechaNacimiento)}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted mb-1 small">Fecha de defunción</p>
                  <p className="fw-semibold">
                    {formatDate(contrato.difunto?.fechaDefuncion)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ----- Responsables ----- */}
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
                      <div className="col-md-6" key={item.responsableId}>
                        <div className="border rounded p-3 h-100">
                          <div className="fw-semibold">
                            {persona?.nombre || '-'} {persona?.apellido || ''}
                          </div>
                          <div className="small text-muted">
                            {persona?.tipoIdentificacion || '-'}:{' '}
                            {persona?.numeroIdentificacion || '-'}
                          </div>
                          {persona?.telefono && (
                            <div className="small text-muted">
                              <i className="ti ti-phone me-1"></i>
                              {persona.telefono}
                            </div>
                          )}
                          {persona?.email && (
                            <div className="small text-muted">
                              <i className="ti ti-mail me-1"></i>
                              {persona.email}
                            </div>
                          )}
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

          {/* ----- Cuotas ----- */}
          <div className="card mb-4">
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
                    <th>Fecha de pago</th>
                  </tr>
                </thead>
                <tbody>
                  {(contrato.cuotas || []).map((cuota: any) => (
                    <tr key={cuota.id}>
                      <td>{cuota.numero}</td>
                      <td>{formatCurrency(cuota.monto)}</td>
                      <td>{formatDate(cuota.fechaVencimiento)}</td>
                      <td>
                        <span
                          className={`badge ${cuota.pagada ? 'bg-success' : 'bg-danger'}`}
                        >
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

          {/* ----- Recibos ----- */}
          {recibos.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title">Recibos emitidos</h5>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Recibo</th>
                      <th>Fecha</th>
                      <th>Método</th>
                      <th>Banco / Referencia</th>
                      <th>Cuotas</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recibos.map((pago: any) => (
                      <tr key={pago.id}>
                        <td>
                          <strong>{pago.numeroRecibo}</strong>
                        </td>
                        <td>{formatDate(pago.fechaPago)}</td>
                        <td>{pago.metodoPago}</td>
                        <td>
                          {pago.banco?.nombre || pago.referencia || '-'}
                        </td>
                        <td>
                          {pago.cuotas
                            .map((c: any) => `#${c.numero}`)
                            .join(', ')}
                        </td>
                        <td>{formatCurrency(pago.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ----- Contratos relacionados / renovaciones ----- */}
          {(contratoOrigen ||
            contratoRelacionado ||
            contratosHijos.length > 0) && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title">Vínculos del contrato</h5>
              </div>
              <div className="card-body">
                {contratoOrigen && (
                  <div className="mb-2">
                    <span className="text-muted small me-2">
                      Renueva al contrato:
                    </span>
                    <Link
                      href={`/contratos/${contratoOrigen.id}`}
                      className="link-primary"
                    >
                      {contratoOrigen.numeroSecuencial}
                    </Link>
                  </div>
                )}
                {contratoRelacionado && (
                  <div className="mb-2">
                    <span className="text-muted small me-2">
                      Comparte bóveda con:
                    </span>
                    <Link
                      href={`/contratos/${contratoRelacionado.id}`}
                      className="link-primary"
                    >
                      {contratoRelacionado.numeroSecuencial}
                    </Link>
                    {contratoRelacionado.difunto && (
                      <span className="text-muted small ms-2">
                        ({contratoRelacionado.difunto.nombre}{' '}
                        {contratoRelacionado.difunto.apellido})
                      </span>
                    )}
                  </div>
                )}
                {contratosHijos.length > 0 && (
                  <div>
                    <span className="text-muted small d-block mb-1">
                      Renovaciones derivadas:
                    </span>
                    <ul className="mb-0">
                      {contratosHijos.map((h) => (
                        <li key={h.id}>
                          <Link
                            href={`/contratos/${h.id}`}
                            className="link-primary"
                          >
                            {h.numeroSecuencial}
                          </Link>{' '}
                          <span className="text-muted small">
                            ({formatDate(h.fechaInicio)} →{' '}
                            {formatDate(h.fechaFin)})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ----- Lateral: resumen + acciones ----- */}
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title">Resumen de pagos</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Total contrato</span>
                <span className="fw-semibold">
                  {formatCurrency(contrato.montoTotal)}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Pagado</span>
                <span className="text-success fw-semibold">
                  {formatCurrency(montoPagado)}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Pendiente</span>
                <span className="text-warning fw-semibold">
                  {formatCurrency(montoPendiente)}
                </span>
              </div>
              {Number(contrato.montoTotal) > 0 && (
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{
                      width: `${Math.min(
                        100,
                        (montoPagado / Number(contrato.montoTotal)) * 100,
                      )}%`,
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Acciones</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-2">
                <a
                  href={`/api/contratos/${id}/pdf`}
                  className="btn btn-outline-primary w-100"
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="ti ti-file-type-pdf me-1"></i> Ver PDF
                </a>
                <Link
                  href={`/contratos/${id}/print`}
                  className="btn btn-outline-primary w-100"
                  target="_blank"
                >
                  <i className="ti ti-printer me-1"></i> Vista imprimible
                </Link>
                <Link
                  href={`/contratos/${id}/edit`}
                  className="btn btn-outline-primary w-100"
                >
                  <i className="ti ti-edit me-1"></i> Editar contrato
                </Link>
                <Link
                  href={`/contratos/create?contratoOrigenId=${id}`}
                  className="btn btn-outline-primary w-100"
                >
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
