export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
          <p className="mt-1 text-sm text-slate-500">
            Parámetros generales del sistema.
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <i className="ti ti-settings text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-700">Parámetros institucionales</h3>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-primary-200">
            <i className="ti ti-tool text-2xl" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-800">
            Página de configuración en construcción
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Esta sección está preparada en frontend para continuar con la migración de
            parámetros institucionales (datos del cementerio, ajustes de contratos,
            plantillas y notificaciones).
          </p>
        </div>
      </section>
    </div>
  );
}
