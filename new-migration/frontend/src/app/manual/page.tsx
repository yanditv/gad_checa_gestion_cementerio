import Link from 'next/link';

export default function ManualPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manual de Usuario</h1>
          <p className="mt-1 text-sm text-slate-500">
            Guía funcional del sistema de gestión del cementerio.
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <i className="ti ti-book text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-700">Documentación</h3>
        </header>
        <div className="p-5">
          <p className="text-sm text-slate-600">
            El manual histórico del sistema original está disponible en el repositorio
            legado. Puedes consultarlo en:
          </p>
          <div className="mt-4">
            <Link
              href="/reportes"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <i className="ti ti-external-link" />
              Ir al sistema
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
