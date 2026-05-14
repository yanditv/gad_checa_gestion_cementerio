export function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <span className="font-semibold text-primary-600">
            GAD Parroquial de Checa
          </span>
          <span className="mx-2 text-slate-300">·</span>
          Sistema de Gestión de Cementerio
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Sistema activo
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="ti ti-database text-info-600" />
            Base de datos
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="ti ti-shield-check text-warning-600" />
            Seguro
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span>v1.0.0</span>
          <span className="text-slate-300">·</span>
          <span>© 2024 GAD Checa</span>
          <span className="text-slate-300">·</span>
          <a
            href="https://teobu.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-600 hover:bg-primary-100"
          >
            Teobu
          </a>
        </div>
      </div>
    </footer>
  );
}
