import {
  formatCurrency,
  formatDate,
  getContratoById,
} from '@/lib/contratos-server';
import { PrintActions } from './PrintActions';

export default async function ContratoPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const { id } = await params;
  const { autoprint } = await searchParams;
  const contrato = await getContratoById(id);
  const cementerio = contrato.boveda?.bloque?.cementerio;
  const responsablePrincipal =
    contrato.responsables?.[0]?.responsable?.persona;

  const responsables = contrato.responsables || [];
  const cuotas = contrato.cuotas || [];
  const nombreDifunto = `${contrato.difunto?.nombre || 'No especificado'} ${
    contrato.difunto?.apellido || ''
  }`.trim();
  const nombreResponsable = `${
    responsablePrincipal?.nombre || '________________'
  } ${responsablePrincipal?.apellido || ''}`.trim();
  const identidadResponsable =
    responsablePrincipal?.numeroIdentificacion || '__________';
  const telefonoResponsable = responsablePrincipal?.telefono || '__________';
  const correoResponsable =
    responsablePrincipal?.email || '________________';
  const presidente =
    cementerio?.presidente || 'Presidente del GAD Parroquial de Checa';
  const direccion = cementerio?.direccion || 'Checa, Ecuador';
  const telefono = cementerio?.telefono || '02-XXXXXXX';
  const correo = cementerio?.email || 'checa@example.gob.ec';
  const numeroCuenta = cementerio?.numeroCuenta || '2000324704';
  const nombreEntidadFinanciera =
    cementerio?.nombreEntidadFinanciera || 'Banco del Austro';
  const plazoTexto = `${cuotas.length || contrato.numeroDeMeses || 0} años`;
  const totalContrato =
    cuotas.length > 0
      ? cuotas.reduce(
          (sum: number, cuota: any) => sum + Number(cuota.monto || 0),
          0,
        )
      : Number(contrato.montoTotal || 0);

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
                alt="GAD Checa"
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div>
                <div className="font-display text-xl font-bold text-brand-dark">
                  GAD Parroquial de Checa
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
                {contrato.numeroSecuencial}
              </div>
              <div className="text-xs text-slate-500">
                Fecha de impresión: {formatDate(new Date())}
              </div>
            </div>
          </header>

          <h1 className="mb-5 text-center text-base font-bold uppercase tracking-wide text-slate-900">
            Contrato de arriendo de bóveda del cementerio de la parroquia
            Checa Nro. {contrato.numeroSecuencial || 'S/N'}
          </h1>

          <div className="space-y-3 text-justify text-sm leading-7 text-slate-700">
            <p>
              En la Parroquia de Checa, a los{' '}
              <strong>{new Date(contrato.fechaInicio).getDate()}</strong> días
              del mes de{' '}
              <strong>
                {new Date(contrato.fechaInicio).toLocaleDateString('es-EC', {
                  month: 'long',
                })}
              </strong>{' '}
              del{' '}
              <strong>{new Date(contrato.fechaInicio).getFullYear()}</strong>,
              comparecen a celebrar el presente contrato de arrendamiento, por
              una parte y en calidad de arrendador, el Gobierno Parroquial de
              Checa, debidamente representado por el{' '}
              <strong>{presidente}</strong>; por otro lado, el/la Sr/Sra.{' '}
              <strong>{nombreResponsable}</strong> con número de identidad{' '}
              <strong>{identidadResponsable}</strong>, número de teléfono{' '}
              <strong>{telefonoResponsable}</strong>, correo electrónico{' '}
              <strong>{correoResponsable}</strong>, los comparecientes son
              mayores de edad, capaces ante la ley para celebrar todo acto y
              contrato quienes celebran el presente contrato de arrendamiento
              de acuerdo con las siguientes cláusulas:
            </p>

            <p>
              <strong>PRIMERA COMPARECIENTES. —</strong> Comparecen por una
              parte el Gobierno Parroquial de Checa representada por su
              presidente el <strong>{presidente}</strong>; a quien en lo
              posterior se lo llamará arrendador, y por otra parte comparece
              el/la Sr/Sra. <strong>{nombreResponsable}</strong> a quien en lo
              posterior se le llamará Arrendatario.
            </p>

            <p>
              <strong>SEGUNDA ANTECEDENTE. —</strong> El Gobierno Parroquial
              de Checa es la Institución Pública que administra el Cementerio
              General de la Parroquia, es por ello que se encuentra facultado
              para suscribir todo contrato de arrendamiento o venta de bóveda
              del cementerio.
            </p>

            <p>
              <strong>TERCER OBJETO. —</strong> El Gobierno Parroquial de
              Checa, en su calidad de Administrador del Cementerio General de
              la Parroquia, por el presente contrato da en arriendo una bóveda
              a favor de quien en vida fue: <strong>{nombreDifunto}</strong>{' '}
              con número de cédula{' '}
              <strong>
                {contrato.difunto?.numeroIdentificacion || 'No especificado'}
              </strong>
              , restos que serán depositados en la bóveda número{' '}
              <strong>
                {contrato.boveda?.numero || '________________'}
              </strong>{' '}
              en el bloque{' '}
              <strong>
                {contrato.boveda?.bloque?.nombre || '________________'}
              </strong>
              .
            </p>

            <p>
              <strong>CUARTA: PRECIO. —</strong> El valor por arriendo de la
              Bóveda es de <strong>{formatCurrency(totalContrato)}</strong>,
              valor que fue cancelado con depósito en la entidad financiera{' '}
              <strong>{nombreEntidadFinanciera}</strong> cta. #{' '}
              <strong>{numeroCuenta}</strong>.
            </p>

            <p>
              <strong>QUINTA: OTRA. —</strong> La parte arrendadora aclara que
              una vez que el Gobierno Parroquial entrega el derecho de uso por{' '}
              <strong>{plazoTexto}</strong> a partir de la fecha del{' '}
              <strong>{formatDate(contrato.fechaInicio)}</strong>, la parte
              arrendataria. Vence el contrato el{' '}
              <strong>{formatDate(contrato.fechaFin)}</strong>.
            </p>

            <p>
              <strong>SEXTA: —</strong> Las partes por estar conforme con las
              estipulaciones del presente contrato, firman al pie del mismo y
              por duplicado para constancia de lo actuado suscriben.
            </p>

            {contrato.observaciones ? (
              <p>
                <strong>OBSERVACIONES: —</strong> {contrato.observaciones}
              </p>
            ) : null}
          </div>

          {/* Datos del difunto */}
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
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
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Responsables
            </h2>
            <table className="min-w-full border border-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                      className="border border-slate-200 px-2 py-2 text-center text-slate-400"
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
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Cuotas
            </h2>
            <table className="min-w-full border border-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                      className="border border-slate-200 px-2 py-2 text-center text-slate-400"
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
              <div className="text-xs text-slate-500">PRESIDENTE GAD CHECA</div>
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
