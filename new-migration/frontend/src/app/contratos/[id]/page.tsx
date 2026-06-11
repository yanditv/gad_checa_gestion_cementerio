import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  formatCurrency,
  formatDate,
  getContratoById,
  getContratoEstado,
} from '@/lib/contratos-server';
import { RelacionActions } from './RelacionActions';
import { DocumentosSection } from './DocumentosSection';

const ESTADO_BADGE: Record<string, string> = {
  Activo: 'bg-green-50 text-green-700 ring-green-200',
  Vencido: 'bg-amber-50 text-amber-700 ring-amber-200',
  Inactivo: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const ESTADO_ALERT: Record<string, { box: string; icon: string }> = {
  Activo: {
    box: 'bg-green-50 text-green-700 border-green-200',
    icon: 'ti-circle-check',
  },
  Vencido: {
    box: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'ti-alert-circle',
  },
  Inactivo: {
    box: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: 'ti-circle-off',
  },
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-wide text-slate-400">
      {children}
    </p>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <p className="mt-0.5 text-sm font-medium text-slate-700">{children}</p>;
}

function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft ${className}`}
    >
      {title && (
        <header className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

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
    .filter((c: any) => c.pagada)
    .reduce((sum: number, c: any) => sum + Number(c.monto || 0), 0);

  const montoPendiente = (contrato.cuotas || [])
    .filter((c: any) => !c.pagada)
    .reduce((sum: number, c: any) => sum + Number(c.monto || 0), 0);

  const estadoContrato = getContratoEstado(contrato);
  const propietario = contrato.boveda?.propietario?.persona;
  const contratosHijos: any[] = contrato.contratosHijos || [];
  const contratoOrigen = contrato.contratoOrigen;
  const contratoRelacionado = contrato.contratoRelacionado;

  // Recibos únicos: agrupa cuotas pagadas por Pago.
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

  const totalContrato = Number(contrato.montoTotal || 0);
  const pctPagado =
    totalContrato > 0 ? Math.min(100, (montoPagado / totalContrato) * 100) : 0;

  const alert = ESTADO_ALERT[estadoContrato] ?? ESTADO_ALERT['Inactivo'];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Contrato{' '}
            <span className="font-mono text-primary-600">
              {contrato.numeroSecuencial}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Detalle completo del contrato de arrendamiento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/contratos/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-file-text" />
            PDF
          </a>
          <Link
            href={`/contratos/${id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-printer" />
            Imprimir
          </Link>
          <Link
            href={`/contratos/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-edit" />
            Editar
          </Link>
          <Link
            href="/contratos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <i className="ti ti-arrow-left" />
            Volver
          </Link>
        </div>
      </div>

      {/* Estado alert */}
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${alert.box}`}
      >
        <i className={`ti ${alert.icon} text-xl`} />
        <div>
          Contrato <strong>{estadoContrato.toLowerCase()}</strong>
          {contrato.fechaFin && (
            <> — vigente hasta {formatDate(contrato.fechaFin)}</>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Información del contrato */}
          <Card title="Información del contrato">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Número</FieldLabel>
                <FieldValue>{contrato.numeroSecuencial}</FieldValue>
              </div>
              <div>
                <FieldLabel>Estado</FieldLabel>
                <p className="mt-0.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                      ESTADO_BADGE[estadoContrato] ?? ESTADO_BADGE['Inactivo']
                    }`}
                  >
                    {estadoContrato}
                  </span>
                </p>
              </div>
              <div>
                <FieldLabel>Fecha de inicio</FieldLabel>
                <FieldValue>{formatDate(contrato.fechaInicio)}</FieldValue>
              </div>
              <div>
                <FieldLabel>Fecha de fin</FieldLabel>
                <FieldValue>{formatDate(contrato.fechaFin)}</FieldValue>
              </div>
              <div>
                <FieldLabel>Monto total</FieldLabel>
                <FieldValue>{formatCurrency(contrato.montoTotal)}</FieldValue>
              </div>
              <div>
                <FieldLabel>Tipo</FieldLabel>
                <p className="mt-0.5">
                  {contrato.esRenovacion ? (
                    <span className="inline-flex items-center rounded-full bg-info-50 px-2 py-0.5 text-xs font-medium text-info-600 ring-1 ring-info-200">
                      Renovación
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
                      Nuevo
                    </span>
                  )}
                  {contrato.vecesRenovado > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      Renovado {contrato.vecesRenovado}×
                    </span>
                  )}
                </p>
              </div>
              {contrato.descuento && (
                <div>
                  <FieldLabel>Descuento</FieldLabel>
                  <FieldValue>
                    {contrato.descuento.nombre} —{' '}
                    {Number(contrato.descuento.porcentaje)}%
                  </FieldValue>
                </div>
              )}
              <div className="sm:col-span-2">
                <FieldLabel>Observaciones</FieldLabel>
                <FieldValue>{contrato.observaciones || '—'}</FieldValue>
              </div>
            </div>
          </Card>

          {/* Bóveda */}
          <Card title="Bóveda">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <FieldLabel>Número</FieldLabel>
                <FieldValue>{contrato.boveda?.numero ?? '—'}</FieldValue>
              </div>
              <div>
                <FieldLabel>Bloque</FieldLabel>
                <FieldValue>{contrato.boveda?.bloque?.nombre ?? '—'}</FieldValue>
              </div>
              <div>
                <FieldLabel>Piso</FieldLabel>
                <FieldValue>{contrato.boveda?.piso?.numero ?? '—'}</FieldValue>
              </div>
              <div>
                <FieldLabel>Tipo</FieldLabel>
                <FieldValue>{contrato.boveda?.tipo ?? '—'}</FieldValue>
              </div>
              <div className="col-span-2">
                <FieldLabel>Propietario</FieldLabel>
                <FieldValue>
                  {propietario
                    ? `${propietario.nombre} ${propietario.apellido}`
                    : 'Sin propietario asignado'}
                </FieldValue>
              </div>
              <div className="col-span-2">
                <FieldLabel>Cementerio</FieldLabel>
                <FieldValue>
                  {contrato.boveda?.bloque?.cementerio?.nombre ?? '—'}
                </FieldValue>
              </div>
            </div>
          </Card>

          {/* Difunto */}
          <Card title="Difunto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Nombre</FieldLabel>
                <FieldValue>
                  {contrato.difunto?.nombre ?? '—'}{' '}
                  {contrato.difunto?.apellido ?? ''}
                </FieldValue>
              </div>
              <div>
                <FieldLabel>Identificación</FieldLabel>
                <FieldValue>
                  {contrato.difunto?.numeroIdentificacion ?? '—'}
                </FieldValue>
              </div>
              <div>
                <FieldLabel>Fecha de nacimiento</FieldLabel>
                <FieldValue>{formatDate(contrato.difunto?.fechaNacimiento)}</FieldValue>
              </div>
              <div>
                <FieldLabel>Fecha de defunción</FieldLabel>
                <FieldValue>{formatDate(contrato.difunto?.fechaDefuncion)}</FieldValue>
              </div>
            </div>
          </Card>

          {/* Responsables */}
          <Card title="Responsables">
            {(contrato.responsables || []).length === 0 ? (
              <p className="text-sm text-slate-400">Sin responsables registrados.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {contrato.responsables.map((item: any) => {
                  const persona = item.responsable?.persona;
                  return (
                    <div
                      key={item.responsableId}
                      className="rounded-lg border border-slate-200 bg-slate-50/40 p-3"
                    >
                      <div className="font-medium text-slate-800">
                        {persona?.nombre} {persona?.apellido}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {persona?.tipoIdentificacion}: {persona?.numeroIdentificacion}
                      </div>
                      {persona?.telefono && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <i className="ti ti-phone text-slate-400" />
                          {persona.telefono}
                        </div>
                      )}
                      {persona?.email && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <i className="ti ti-mail text-slate-400" />
                          {persona.email}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-slate-500">
                        Parentesco:{' '}
                        <span className="text-slate-700">
                          {item.responsable?.parentesco ?? '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Cuotas */}
          <Card title="Cuotas">
            <div className="overflow-x-auto -m-5">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2.5">#</th>
                    <th className="px-5 py-2.5 text-right">Monto</th>
                    <th className="px-5 py-2.5">Vencimiento</th>
                    <th className="px-5 py-2.5">Estado</th>
                    <th className="px-5 py-2.5">Fecha de pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(contrato.cuotas || []).map((c: any) => (
                    <tr key={c.id}>
                      <td className="px-5 py-2.5 font-medium text-slate-700">
                        {c.numero}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {formatCurrency(c.monto)}
                      </td>
                      <td className="px-5 py-2.5 text-slate-600">
                        {formatDate(c.fechaVencimiento)}
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                            c.pagada
                              ? 'bg-green-50 text-green-700 ring-green-200'
                              : 'bg-red-50 text-red-700 ring-red-200'
                          }`}
                        >
                          {c.pagada ? 'Pagada' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-slate-600">
                        {formatDate(c.fechaPago)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recibos */}
          {recibos.length > 0 && (
            <Card title="Recibos emitidos">
              <div className="overflow-x-auto -m-5">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-2.5">Recibo</th>
                      <th className="px-5 py-2.5">Fecha</th>
                      <th className="px-5 py-2.5">Método</th>
                      <th className="px-5 py-2.5">Banco / Referencia</th>
                      <th className="px-5 py-2.5">Cuotas</th>
                      <th className="px-5 py-2.5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {recibos.map((p: any) => (
                      <tr key={p.id}>
                        <td className="px-5 py-2.5 font-mono text-xs font-semibold text-slate-700">
                          {p.numeroRecibo}
                        </td>
                        <td className="px-5 py-2.5 text-slate-600">
                          {formatDate(p.fechaPago)}
                        </td>
                        <td className="px-5 py-2.5 text-slate-600">{p.metodoPago}</td>
                        <td className="px-5 py-2.5 text-slate-600">
                          {p.banco?.nombre ?? p.referencia ?? '—'}
                        </td>
                        <td className="px-5 py-2.5 text-slate-600">
                          {p.cuotas.map((c: any) => `#${c.numero}`).join(', ')}
                        </td>
                        <td className="px-5 py-2.5 text-right font-medium text-slate-700">
                          {formatCurrency(p.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Documentos */}
          <DocumentosSection contratoId={contrato.id} />

          {/* Vínculos */}
          <Card title="Vínculos del contrato">
            {contratoOrigen && (
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Renueva al contrato:
                </span>
                <Link
                  href={`/contratos/${contratoOrigen.id}`}
                  className="font-medium text-primary-600 hover:underline"
                >
                  {contratoOrigen.numeroSecuencial}
                </Link>
              </div>
            )}

            <div className="mb-3">
              <RelacionActions
                contratoId={contrato.id}
                relacionado={contratoRelacionado ?? null}
              />
            </div>

            {contratosHijos.length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                  Renovaciones derivadas:
                </p>
                <ul className="space-y-1 text-sm">
                  {contratosHijos.map((h) => (
                    <li key={h.id}>
                      <Link
                        href={`/contratos/${h.id}`}
                        className="font-medium text-primary-600 hover:underline"
                      >
                        {h.numeroSecuencial}
                      </Link>
                      <span className="ml-2 text-xs text-slate-500">
                        ({formatDate(h.fechaInicio)} → {formatDate(h.fechaFin)})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {/* Lateral */}
        <div className="space-y-6">
          <Card title="Resumen de pagos">
            <dl className="space-y-2 text-sm">
              <div className="flex items-baseline justify-between">
                <dt className="text-slate-500">Total contrato</dt>
                <dd className="font-medium text-slate-700">
                  {formatCurrency(contrato.montoTotal)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-slate-500">Pagado</dt>
                <dd className="font-semibold text-green-600">
                  {formatCurrency(montoPagado)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-slate-500">Pendiente</dt>
                <dd className="font-semibold text-amber-600">
                  {formatCurrency(montoPendiente)}
                </dd>
              </div>
            </dl>

            {totalContrato > 0 && (
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-green-500 transition-[width]"
                    style={{ width: `${pctPagado}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-slate-400">
                  {pctPagado.toFixed(0)}% cobrado
                </p>
              </div>
            )}
          </Card>

          <Card title="Acciones">
            <div className="flex flex-col gap-2">
              <a
                href={`/api/contratos/${id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <i className="ti ti-file-text" />
                Ver PDF oficial
              </a>
              <Link
                href={`/contratos/${id}/print`}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <i className="ti ti-printer" />
                Vista imprimible
              </Link>
              <Link
                href={`/contratos/${id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <i className="ti ti-edit" />
                Editar contrato
              </Link>
              <Link
                href={`/contratos/${id}/renovar`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600"
              >
                <i className="ti ti-copy" />
                Renovar contrato
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
