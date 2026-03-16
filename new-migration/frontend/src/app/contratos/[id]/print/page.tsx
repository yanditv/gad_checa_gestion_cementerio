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
  const responsablePrincipal = contrato.responsables?.[0]?.responsable?.persona;

  const responsables = contrato.responsables || [];
  const cuotas = contrato.cuotas || [];
  const nombreDifunto = `${contrato.difunto?.nombre || 'No especificado'} ${contrato.difunto?.apellido || ''}`.trim();
  const nombreResponsable = `${responsablePrincipal?.nombre || '________________'} ${responsablePrincipal?.apellido || ''}`.trim();
  const identidadResponsable = responsablePrincipal?.numeroIdentificacion || '__________';
  const telefonoResponsable = responsablePrincipal?.telefono || '__________';
  const correoResponsable = responsablePrincipal?.email || '________________';
  const presidente = cementerio?.presidente || 'Presidente del GAD Parroquial de Checa';
  const direccion = cementerio?.direccion || 'Checa, Ecuador';
  const telefono = cementerio?.telefono || '02-XXXXXXX';
  const correo = cementerio?.email || 'checa@example.gob.ec';
  const numeroCuenta = cementerio?.numeroCuenta || '2000324704';
  const nombreEntidadFinanciera = cementerio?.nombreEntidadFinanciera || 'Banco del Austro';
  const plazoTexto = `${cuotas.length || contrato.numeroDeMeses || 0} años`;
  const totalContrato = cuotas.length > 0
    ? cuotas.reduce((sum: number, cuota: any) => sum + Number(cuota.monto || 0), 0)
    : Number(contrato.montoTotal || 0);

  return (
    <div className="container py-4">
      <PrintActions backHref={`/contratos/${id}`} autoPrint={autoprint === '1'} />

      <div
        className="bg-white text-dark p-4 shadow-sm border rounded print-contract position-relative overflow-hidden"
        style={{
          backgroundImage: 'url(/images/background.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.92)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
          <div className="d-flex align-items-center gap-3">
            <img src="/images/logo.jpeg" alt="GAD Checa" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
            <div>
              <div className="fw-bold fs-5">GAD Parroquial de Checa</div>
              <div className="text-muted">Sistema de Gestion de Cementerio</div>
            </div>
          </div>
          <div className="text-end">
            <div className="fw-bold fs-5">Contrato de Arrendamiento</div>
            <div>{contrato.numeroSecuencial}</div>
            <div className="text-muted">Fecha de impresion: {formatDate(new Date())}</div>
          </div>
        </div>

        <h4 className="text-center mb-4">
          CONTRATO DE ARRIENDO DE BOVEDA DEL CEMENTERIO DE LA PARROQUIA CHECA NRO. {contrato.numeroSecuencial || 'S/N'}
        </h4>

        <p style={{ textAlign: 'justify', lineHeight: 1.8 }}>
          En la Parroquia de Checa, a los <strong>{new Date(contrato.fechaInicio).getDate()}</strong> días del mes de{' '}
          <strong>{new Date(contrato.fechaInicio).toLocaleDateString('es-EC', { month: 'long' })}</strong> del{' '}
          <strong>{new Date(contrato.fechaInicio).getFullYear()}</strong>, comparecen a celebrar el presente contrato de
          arrendamiento, por una parte y en calidad de arrendador, el Gobierno Parroquial de Checa, debidamente
          representado por el <strong>{presidente}</strong>; por otro lado, el/la Sr/Sra. <strong>{nombreResponsable}</strong> con
          número de identidad <strong>{identidadResponsable}</strong>, número de teléfono <strong>{telefonoResponsable}</strong>,
          correo electrónico <strong>{correoResponsable}</strong>, los comparecientes son mayores de edad, capaces ante la ley
          para celebrar todo acto y contrato quienes celebran el presente contrato de arrendamiento de acuerdo con las
          siguientes cláusulas:
        </p>

        <p style={{ textAlign: 'justify', lineHeight: 1.8 }}>
          <strong>PRIMERA COMPARECIENTES. -</strong> Comparecen por una parte el Gobierno Parroquial de Checa representada por
          su presidente el <strong>{presidente}</strong>; a quien en lo posterior se lo llamará arrendador, y por otra parte
          comparece el/la Sr/Sra. <strong>{nombreResponsable}</strong> a quien en lo posterior se le llamará Arrendatario.
        </p>

        <p style={{ textAlign: 'justify', lineHeight: 1.8 }}>
          <strong>SEGUNDA ANTECEDENTE. -</strong> El Gobierno Parroquial de Checa es la Institución Pública que administra el
          Cementerio General de la Parroquia, es por ello que se encuentra facultado para suscribir todo contrato de
          arrendamiento o venta de bóveda del cementerio.
        </p>

        <p style={{ textAlign: 'justify', lineHeight: 1.8 }}>
          <strong>TERCER OBJETO. -</strong> El Gobierno Parroquial de Checa, en su calidad de Administrador del Cementerio
          General de la Parroquia, por el presente contrato da en arriendo una bóveda a favor de quien en vida fue:{' '}
          <strong>{nombreDifunto}</strong> con número de cédula <strong>{contrato.difunto?.numeroIdentificacion || 'No especificado'}</strong>,
          restos que serán depositados en la bóveda número <strong>{contrato.boveda?.numero || '________________'}</strong> en el
          bloque <strong>{contrato.boveda?.bloque?.nombre || '________________'}</strong>.
        </p>

        <p style={{ textAlign: 'justify', lineHeight: 1.8 }}>
          <strong>CUARTA: PRECIO. -</strong> El valor por arriendo de la Bóveda es de <strong>{formatCurrency(totalContrato)}</strong>,
          valor que fue cancelado con depósito en la entidad financiera <strong>{nombreEntidadFinanciera}</strong> cta. #{' '}
          <strong>{numeroCuenta}</strong>.
        </p>

        <p style={{ textAlign: 'justify', lineHeight: 1.8 }}>
          <strong>QUINTA: OTRA. -</strong> La parte arrendadora aclara que una vez que el Gobierno Parroquial entrega el
          derecho de uso por <strong>{plazoTexto}</strong> a partir de la fecha del{' '}
          <strong>{formatDate(contrato.fechaInicio)}</strong>, la parte arrendataria. Vence el contrato el{' '}
          <strong>{formatDate(contrato.fechaFin)}</strong>.
        </p>

        <p style={{ textAlign: 'justify', lineHeight: 1.8 }}>
          <strong>SEXTA: -</strong> Las partes por estar conforme con las estipulaciones del presente contrato, firman al pie
          del mismo y por duplicado para constancia de lo actuado suscriben.
        </p>

        {contrato.observaciones ? (
          <p style={{ textAlign: 'justify', lineHeight: 1.8 }}>
            <strong>OBSERVACIONES: -</strong> {contrato.observaciones}
          </p>
        ) : null}

        <div className="mb-4">
          <h5 className="mb-2">Datos del Difunto</h5>
          <div className="row g-3">
            <div className="col-md-6">
              <div><strong>Nombres:</strong> {contrato.difunto?.nombre || '-'} {contrato.difunto?.apellido || ''}</div>
            </div>
            <div className="col-md-6">
              <div><strong>Identificacion:</strong> {contrato.difunto?.numeroIdentificacion || '-'}</div>
            </div>
            <div className="col-md-6">
              <div><strong>Fecha Nacimiento:</strong> {formatDate(contrato.difunto?.fechaNacimiento)}</div>
            </div>
            <div className="col-md-6">
              <div><strong>Fecha Defuncion:</strong> {formatDate(contrato.difunto?.fechaDefuncion)}</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h5 className="mb-2">Responsables</h5>
          <table className="table table-sm table-bordered">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Identificacion</th>
                <th>Parentesco</th>
              </tr>
            </thead>
            <tbody>
              {responsables.length > 0 ? (
                responsables.map((item: any) => {
                  const persona = item.responsable?.persona;
                  return (
                    <tr key={item.id}>
                      <td>{persona?.nombre || '-'} {persona?.apellido || ''}</td>
                      <td>{persona?.numeroIdentificacion || '-'}</td>
                      <td>{item.responsable?.parentesco || '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3}>Sin responsables registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <h5 className="mb-2">Cuotas</h5>
          <table className="table table-sm table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Vencimiento</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cuotas.length > 0 ? (
                cuotas.map((cuota: any) => (
                  <tr key={cuota.id}>
                    <td>{cuota.numero}</td>
                    <td>{formatDate(cuota.fechaVencimiento)}</td>
                    <td>{formatCurrency(cuota.monto)}</td>
                    <td>{cuota.pagada ? 'Pagada' : 'Pendiente'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>Sin cuotas registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <h5 className="mb-2">Observaciones</h5>
          <p className="mb-0">{contrato.observaciones || 'Sin observaciones.'}</p>
        </div>

        <div className="row mt-5 pt-5">
          <div className="col-6 text-center">
            <div className="border-top pt-2">Firma Responsable</div>
            <div className="fw-semibold mt-2">{nombreResponsable}</div>
            <div className="small">CI. {identidadResponsable}</div>
            <div className="small">ARRENDATARIO</div>
          </div>
          <div className="col-6 text-center">
            <div className="border-top pt-2">Firma Administracion</div>
            <div className="fw-semibold mt-2">{presidente}</div>
            <div className="small">PRESIDENTE GAD CHECA</div>
            <div className="small">ARRENDADOR</div>
          </div>
        </div>

        <div className="text-center border-top pt-3 mt-4 small text-muted">
          Dirección: {direccion} | Teléfono: {telefono} | Correo: {correo}
        </div>
        </div>
      </div>
    </div>
  );
}
