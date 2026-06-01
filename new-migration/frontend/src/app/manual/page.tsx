import Link from 'next/link';

const SECCIONES = [
  { title: 'Introducción', anchor: '1-introduccion' },
  { title: 'Acceso al sistema', anchor: '2-acceso-al-sistema' },
  { title: 'Dashboard', anchor: '3-pantalla-principal-dashboard' },
  { title: 'Contratos', anchor: '41-contratos' },
  { title: 'Cobros', anchor: '42-cobros' },
  { title: 'Bóvedas', anchor: '43-bovedas' },
  { title: 'Personas', anchor: '44-personas' },
  { title: 'Difuntos', anchor: '45-difuntos' },
  { title: 'Bloques', anchor: '46-bloques' },
  { title: 'Reportes', anchor: '47-reportes' },
  { title: 'Configuración', anchor: '48-configuracion' },
  { title: 'Administración', anchor: '49-administracion-solo-administrador' },
  { title: 'Notificaciones', anchor: '410-notificaciones' },
  { title: 'Flujos comunes', anchor: '5-flujos-comunes' },
  { title: 'Preguntas frecuentes', anchor: '6-preguntas-frecuentes' },
];

const MODULOS = [
  { icon: 'ti-file-text', label: 'Contratos', desc: 'Crear, renovar y consultar contratos de arriendo.', href: '/contratos' },
  { icon: 'ti-cash', label: 'Cobros', desc: 'Registrar pagos de cuotas y anular recibos.', href: '/cobros' },
  { icon: 'ti-building-tomb', label: 'Bóvedas', desc: 'Catastro de bóvedas, nichos y tumbas.', href: '/bovedas' },
  { icon: 'ti-user', label: 'Personas', desc: 'Registro de propietarios y responsables.', href: '/personas' },
  { icon: 'ti-ghost', label: 'Difuntos', desc: 'Registro de difuntos por bóveda.', href: '/difuntos' },
  { icon: 'ti-chart-bar', label: 'Reportes', desc: 'PDF y Excel de ingresos, cuentas por cobrar y ocupación.', href: '/reportes' },
  { icon: 'ti-settings', label: 'Configuración', desc: 'Descuentos, bancos, datos del cementerio y GAD.', href: '/configuracion' },
  { icon: 'ti-users', label: 'Admin', desc: 'Gestión de usuarios y roles.', href: '/admin/usuarios' },
];

const RESUMEN = [
  {
    id: '1-introduccion',
    title: 'Introducción',
    body: 'El sistema permite administrar catastro de bóvedas, contratos, cobros, personas, difuntos y reportes operativos y financieros.',
  },
  {
    id: '2-acceso-al-sistema',
    title: 'Acceso al sistema',
    body: 'El ingreso se realiza con correo y contraseña. Si el usuario olvida la clave, puede usar la recuperación disponible en el login.',
  },
  {
    id: '3-pantalla-principal-dashboard',
    title: 'Dashboard',
    body: 'Muestra resumen financiero, disponibilidad de bóvedas, contratos activos y accesos rápidos a los módulos principales.',
  },
  {
    id: '41-contratos',
    title: 'Contratos',
    body: 'El flujo principal usa un wizard por pasos para seleccionar bóveda, difunto, responsables y pago antes de confirmar el contrato.',
  },
  {
    id: '42-cobros',
    title: 'Cobros',
    body: 'Permite seleccionar cuotas pendientes, aplicar descuentos o banco cuando corresponda y generar el recibo del pago.',
  },
  {
    id: '43-bovedas',
    title: 'Bóvedas',
    body: 'Desde aquí se consulta la ocupación, el historial asociado y el cambio de propietario cuando aplica.',
  },
  {
    id: '44-personas',
    title: 'Personas',
    body: 'Gestiona propietarios y responsables, incluyendo sus datos de contacto y vínculos con contratos o bóvedas.',
  },
  {
    id: '45-difuntos',
    title: 'Difuntos',
    body: 'Registra y consulta difuntos asociados a bóvedas, con sus datos personales y de defunción.',
  },
  {
    id: '46-bloques',
    title: 'Bloques',
    body: 'Organiza las bóvedas por bloque y pisos dentro del cementerio.',
  },
  {
    id: '47-reportes',
    title: 'Reportes',
    body: 'Incluye ingresos, cuentas por cobrar, ocupación de bóvedas, bloques y comparativas del periodo.',
  },
  {
    id: '48-configuracion',
    title: 'Configuración',
    body: 'Centraliza descuentos, bancos, datos del cementerio, datos del GAD e importación de catastro para administradores.',
  },
  {
    id: '49-administracion-solo-administrador',
    title: 'Administración',
    body: 'Permite gestionar usuarios, roles, estados de acceso y reseteo de contraseñas.',
  },
  {
    id: '410-notificaciones',
    title: 'Notificaciones',
    body: 'El sistema alerta sobre contratos por vencer y cuotas vencidas, tanto en el header como en la página dedicada.',
  },
  {
    id: '5-flujos-comunes',
    title: 'Flujos comunes',
    body: 'El manual documenta los pasos más frecuentes: registrar un contrato, cobrar cuotas y consultar el estado de una bóveda.',
  },
  {
    id: '6-preguntas-frecuentes',
    title: 'Preguntas frecuentes',
    body: 'Resume dudas típicas sobre eliminación lógica, anulación de pagos, cambio de propietario y envío de correos.',
  },
];

export default function ManualPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manual de Usuario</h1>
          <p className="mt-1 text-sm text-slate-500">
            Guía funcional del sistema de gestión del cementerio — GAD Parroquial de Checa.
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <i className="ti ti-book text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-700">Índice de contenidos</h3>
        </header>
        <div className="p-5">
          <ul className="columns-1 gap-x-8 space-y-1 sm:columns-2">
            {SECCIONES.map((s) => (
              <li key={s.anchor}>
                <a
                  href={`#${s.anchor}`}
                  className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <i className="ti ti-apps text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-700">Acceso rápido a módulos</h3>
        </header>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-primary-200 hover:bg-primary-50/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                <i className={`${m.icon} text-lg`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{m.label}</p>
                <p className="text-xs text-slate-500">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <i className="ti ti-list-details text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-700">Resumen del manual</h3>
        </header>
        <div className="space-y-4 p-5">
          {RESUMEN.map((item) => (
            <section key={item.id} id={item.id} className="scroll-mt-24 rounded-lg border border-slate-100 p-4">
              <h4 className="text-sm font-semibold text-slate-700">{item.title}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-500">{item.body}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <i className="ti ti-help text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-700">Preguntas frecuentes</h3>
        </header>
        <div className="space-y-3 p-5">
          <Faq q="¿Puedo borrar un contrato?" a="No se borra físicamente. Se marca como inactivo. Solo Administrador." />
          <Faq q="¿Qué pasa si me equivoco en un cobro?" a="Un Administrador puede anular el pago desde su detalle." />
          <Faq q="¿Cómo cambio al propietario de una bóveda?" a="Desde el detalle de la bóveda → Cambiar propietario." />
          <Faq q="¿El sistema envía correos?" a="Sí, para recuperación de contraseña y notificaciones de vencimientos." />
        </div>
      </section>

      <div className="text-center text-xs text-slate-400">
        Documentación completa en <code className="rounded bg-slate-100 px-1 py-0.5">new-migration/MANUAL_USUARIO.md</code>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{q}</p>
      <p className="text-sm text-slate-500">{a}</p>
    </div>
  );
}
