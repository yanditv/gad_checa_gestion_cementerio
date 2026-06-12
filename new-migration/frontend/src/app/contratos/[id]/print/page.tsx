import {
  formatCurrency,
  formatDate,
  getContratoById,
  getGADInformacion,
} from '@/lib/contratos-server';
import { PrintActions } from './PrintActions';
import {
  DEFAULT_PREAMBULO,
  DEFAULT_CLAUSULA1,
  DEFAULT_CLAUSULA2,
  DEFAULT_CLAUSULA3,
  DEFAULT_CLAUSULA4,
  DEFAULT_CLAUSULA5,
  DEFAULT_CLAUSULA6,
} from '@/lib/default-contrato-templates';

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatFechaLarga(value: string | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return { dia: '--', mes: '--------', anio: '----' };
  return {
    dia: String(date.getDate()).padStart(2, '0'),
    mes: MESES_ES[date.getMonth()] ?? '--------',
    anio: String(date.getFullYear()),
  };
}

function joinNombre(persona?: {
  nombre?: string | null;
  apellido?: string | null;
} | null): string {
  if (!persona) return '';
  return `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim();
}

function compileTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, val ?? '');
  }
  return result;
}

function renderFormattedText(text: string) {
  const parts = text.split('**');
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return <strong key={idx}>{part}</strong>;
    }
    return part;
  });
}

export default async function ContratoPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const { id } = await params;
  const { autoprint } = await searchParams;

  const [contrato, gadInfo] = await Promise.all([
    getContratoById(id),
    getGADInformacion().catch(() => null),
  ]);

  const cementerio = contrato.boveda?.bloque?.cementerio ?? {};
  const difunto = contrato.difunto ?? {};
  const responsablePrincipal = contrato.responsables?.[0]?.responsable?.persona ?? {};

  const responsables = contrato.responsables || [];
  const cuotas = contrato.cuotas || [];

  const presidenteTitulo = cementerio.abreviaturaTituloPresidente || 'Sr.';
  const presidenteNombre = cementerio.presidente || 'Presidente';
  const presidente = `${presidenteTitulo} ${presidenteNombre}`.trim();

  const gadNombre = gadInfo?.nombre || 'Gobierno Parroquial';
  const parroquia = gadNombre
    .replace(/gobierno\s+(autónomo\s+descentralizado\s+)?parroquial\s+(de\s+)?/gi, '')
    .replace(/gad\s+/gi, '')
    .trim();

  const direccion = cementerio.direccion || gadInfo?.direccion || 'Ecuador';
  const telefono = cementerio.telefono || gadInfo?.telefono || '02-XXXXXXX';
  const correo = cementerio.email || gadInfo?.email || 'info@cementerio.gob.ec';
  const numeroCuenta = cementerio.numeroCuenta || '2000324704';
  const nombreEntidadFinanciera = cementerio.nombreEntidadFinanciera || 'Banco del Austro';
  const entidadFinanciera = cementerio.entidadFinanciera || 'BANCO';

  let bancoTexto = nombreEntidadFinanciera;
  if (String(entidadFinanciera).toUpperCase() === 'BANCO') {
    if (!nombreEntidadFinanciera.toLowerCase().startsWith('banco')) {
      bancoTexto = `el Banco ${nombreEntidadFinanciera}`;
    } else {
      bancoTexto = `el ${nombreEntidadFinanciera}`;
    }
  } else {
    if (!nombreEntidadFinanciera.toLowerCase().startsWith('cooperativa')) {
      bancoTexto = `la Cooperativa ${nombreEntidadFinanciera}`;
    } else {
      bancoTexto = `la ${nombreEntidadFinanciera}`;
    }
  }

  const nombreCementerioRaw = cementerio.nombre || 'de la Parroquia';
  const nombreCementerioUpper = nombreCementerioRaw.toUpperCase();
  const cementerioTexto = nombreCementerioUpper.startsWith('CEMENTERIO')
    ? nombreCementerioUpper
    : `CEMENTERIO ${nombreCementerioUpper}`;

  const nombreResponsable = joinNombre(responsablePrincipal) || '________________';
  const identidadResponsable = responsablePrincipal.numeroIdentificacion || '__________';
  const telefonoResponsable = responsablePrincipal.telefono || '__________';
  const correoResponsable = responsablePrincipal.email || '________________';

  const difuntoNombre = joinNombre(difunto) || 'No especificado';
  const difuntoCI = difunto.numeroIdentificacion || '__________';

  const boveda = contrato.boveda ?? {};
  const piso = boveda.piso ?? null;
  const bloque = boveda.bloque ?? {};
  const bovedaNumero = boveda.numero || '________________';
  
  // Preferir bloque.nombre si está disponible
  const bloqueDescripcion = bloque.nombre || bloque.descripcion || '________________';

  const numeroContrato = contrato.numeroSecuencial || `CTR-${contrato.id}`;
  const totalCuotas = cuotas.reduce(
    (sum: number, c: any) => sum + Number(c.monto ?? 0),
    0,
  );
  const montoTotal = totalCuotas > 0 ? totalCuotas : Number(contrato.montoTotal ?? 0);

  const fechaInicio = formatFechaLarga(contrato.fechaInicio);
  const fechaFin = formatFechaLarga(contrato.fechaFin);
  const aniosArriendo = cuotas.length || Number(contrato.numeroDeMeses) || 0;
  const pisoTexto = piso?.numero != null ? `, piso ${piso.numero}` : '';

  const vars: Record<string, string> = {
    parroquia,
    fechaInicioDia: fechaInicio.dia,
    fechaInicioMes: fechaInicio.mes,
    fechaInicioAnio: fechaInicio.anio,
    fechaFinDia: fechaFin.dia,
    fechaFinMes: fechaFin.mes,
    fechaFinAnio: fechaFin.anio,
    gadNombre,
    presidente,
    responsableNombre: nombreResponsable,
    responsableCI: identidadResponsable,
    responsableTelefono: telefonoResponsable,
    responsableEmail: correoResponsable,
    difuntoNombre,
    difuntoCI,
    bovedaNumero,
    bloqueDescripcion,
    pisoTexto,
    pisoNumero: piso?.numero != null ? String(piso.numero) : '',
    montoTotal: formatCurrency(montoTotal),
    bancoTexto,
    numeroCuenta,
    aniosArriendo: String(aniosArriendo),
    cementerioNombre: cementerio.nombre || 'Cementerio de la Parroquia',
    numeroContrato,
  };

  const tPreambulo = cementerio.contratoPreambulo || DEFAULT_PREAMBULO;
  const tClausula1 = cementerio.contratoClausula1 || DEFAULT_CLAUSULA1;
  const tClausula2 = cementerio.contratoClausula2 || DEFAULT_CLAUSULA2;
  const tClausula3 = cementerio.contratoClausula3 || DEFAULT_CLAUSULA3;
  const tClausula4 = cementerio.contratoClausula4 || DEFAULT_CLAUSULA4;
  const tClausula5 = cementerio.contratoClausula5 || DEFAULT_CLAUSULA5;
  const tClausula6 = cementerio.contratoClausula6 || DEFAULT_CLAUSULA6;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 print:p-0">
      <PrintActions
        backHref={`/contratos/${id}`}
        autoPrint={autoprint === '1'}
      />

      <article
        className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-8 text-slate-800 shadow-soft print:rounded-none print:border-0 print:shadow-none"
        style={{
          backgroundImage: 'url(/images/background.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-white/95" />

        <div className="relative">
          {/* Encabezado */}
          <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.jpeg"
                alt="Logo GAD"
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div>
                <div className="font-display text-xl font-bold text-brand-dark">
                  {gadNombre}
                </div>
                <div className="text-sm text-slate-500">
                  Sistema de Gestión de Cementerio
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">
                Contrato de arrendamiento
              </div>
              <div className="font-mono text-sm text-primary-600">
                {numeroContrato}
              </div>
              <div className="text-xs text-slate-500">
                Fecha de impresión: {formatDate(new Date())}
              </div>
            </div>
          </header>

          <h1 className="mb-5 text-center text-base font-bold uppercase tracking-wide text-slate-900">
            Contrato de arriendo de bóveda del {cementerioTexto} Nro. {numeroContrato}
          </h1>

          <div className="space-y-3 text-justify text-sm leading-7 text-slate-700">
            <p>{renderFormattedText(compileTemplate(tPreambulo, vars))}</p>
            <p>{renderFormattedText(compileTemplate(tClausula1, vars))}</p>
            <p>{renderFormattedText(compileTemplate(tClausula2, vars))}</p>
            <p>{renderFormattedText(compileTemplate(tClausula3, vars))}</p>
            <p>{renderFormattedText(compileTemplate(tClausula4, vars))}</p>
            <p>{renderFormattedText(compileTemplate(tClausula5, vars))}</p>
            <p>{renderFormattedText(compileTemplate(tClausula6, vars))}</p>

            {contrato.observaciones ? (
              <p>
                <strong>OBSERVACIONES: —</strong> {contrato.observaciones}
              </p>
            ) : null}
          </div>

          {/* Datos del difunto */}
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Datos del difunto
            </h2>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <strong>Nombres:</strong> {contrato.difunto?.nombre || '-'}{' '}
                {contrato.difunto?.apellido || ''}
              </div>
              <div>
                <strong>Identificación:</strong>{' '}
                {contrato.difunto?.numeroIdentificacion || '-'}
              </div>
              <div>
                <strong>Fecha de nacimiento:</strong>{' '}
                {formatDate(contrato.difunto?.fechaNacimiento)}
              </div>
              <div>
                <strong>Fecha de defunción:</strong>{' '}
                {formatDate(contrato.difunto?.fechaDefuncion)}
              </div>
            </div>
          </section>

          {/* Responsables */}
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Responsables
            </h2>
            <table className="min-w-full border border-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="border border-slate-200 px-2 py-1.5">
                    Nombre
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5">
                    Identificación
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5">
                    Parentesco
                  </th>
                </tr>
              </thead>
              <tbody>
                {responsables.length > 0 ? (
                  responsables.map((item: any) => {
                    const persona = item.responsable?.persona;
                    return (
                      <tr key={item.responsableId ?? item.id}>
                        <td className="border border-slate-200 px-2 py-1.5">
                          {persona?.nombre || '-'} {persona?.apellido || ''}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5">
                          {persona?.numeroIdentificacion || '-'}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5">
                          {item.responsable?.parentesco || '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="border border-slate-200 px-2 py-2 text-center text-slate-600"
                    >
                      Sin responsables registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Cuotas */}
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Cuotas
            </h2>
            <table className="min-w-full border border-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="border border-slate-200 px-2 py-1.5">#</th>
                  <th className="border border-slate-200 px-2 py-1.5">
                    Vencimiento
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5 text-right">
                    Monto
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {cuotas.length > 0 ? (
                  cuotas.map((cuota: any) => (
                    <tr key={cuota.id}>
                      <td className="border border-slate-200 px-2 py-1.5">
                        {cuota.numero}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5">
                        {formatDate(cuota.fechaVencimiento)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">
                        {formatCurrency(cuota.monto)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5">
                        {cuota.pagada ? 'Pagada' : 'Pendiente'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="border border-slate-200 px-2 py-2 text-center text-slate-600"
                    >
                      Sin cuotas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Firmas */}
          <section className="mt-12 grid grid-cols-2 gap-6 text-center text-sm">
            <div>
              <div className="border-t border-slate-300 pt-2">
                Firma responsable
              </div>
              <div className="mt-2 font-semibold">{nombreResponsable}</div>
              <div className="text-xs text-slate-500">
                CI. {identidadResponsable}
              </div>
              <div className="text-xs text-slate-500">ARRENDATARIO</div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2">
                Firma administración
              </div>
              <div className="mt-2 font-semibold">{presidente}</div>
              <div className="text-xs text-slate-500">
                PRESIDENTE DEL {gadNombre.toUpperCase()}
              </div>
              <div className="text-xs text-slate-500">ARRENDADOR</div>
            </div>
          </section>

          {/* Pie */}
          <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-xs text-slate-500">
            Dirección: {direccion} | Teléfono: {telefono} | Correo: {correo}
          </footer>
        </div>
      </article>
    </div>
  );
}
