import { Book, Download, ExternalLink, FileText } from 'lucide-react';

const MANUAL_REPO_URL =
  'https://github.com/yanditv/gad_checa_gestion_cementerio/blob/master/new-migration/frontend/public/Manual_de_Usuario.pdf';

export default function ManualPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manual de Usuario</h1>
          <p className="mt-1 text-sm text-slate-600">
            Guía funcional oficial del sistema de gestión del cementerio.
          </p>
        </div>
        <a
          href="/Manual_de_Usuario.pdf"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <FileText className="h-4 w-4" aria-hidden="true" /> Abrir PDF
        </a>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <Book className="h-4 w-4 text-primary-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-700">Documentación</h3>
        </header>
        <div className="p-5">
          <p className="text-sm text-slate-600">
            Se restauró el manual oficial del sistema legado para mantener la
            referencia funcional durante la migración.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={MANUAL_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver en GitHub
            </a>
            <a
              href="/Manual_de_Usuario.pdf"
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-soft transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Descargar PDF
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
