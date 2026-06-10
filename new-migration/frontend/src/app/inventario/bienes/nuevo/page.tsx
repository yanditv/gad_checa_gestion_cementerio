'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  inventarioBienesApi,
  inventarioCategoriasApi,
  inventarioCustodiosApi,
} from '@/lib/api';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

const ESTADOS_CONSERVACION = [
  { value: 'bueno', label: 'Bueno' },
  { value: 'regular', label: 'Regular' },
  { value: 'malo', label: 'Malo' },
];

interface FormState {
  codigo: string;
  descripcion: string;
  marca: string;
  modelo: string;
  serie: string;
  fechaAdquisicion: string;
  valorAdquisicion: string;
  fuenteFinanciamiento: string;
  estadoConservacion: string;
  ubicacion: string;
  valorResidual: string;
  vidaUtilMesesOverride: string;
  categoriaId: string;
  custodioId: string;
}

const INITIAL: FormState = {
  codigo: '',
  descripcion: '',
  marca: '',
  modelo: '',
  serie: '',
  fechaAdquisicion: '',
  valorAdquisicion: '',
  fuenteFinanciamiento: '',
  estadoConservacion: 'bueno',
  ubicacion: '',
  valorResidual: '',
  vidaUtilMesesOverride: '',
  categoriaId: '',
  custodioId: '',
};

function toOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export default function NuevoBienPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>(INITIAL);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [custodios, setCustodios] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    inventarioCategoriasApi
      .findAll()
      .then((rows) => setCategorias(rows ?? []))
      .catch(() => undefined);
    inventarioCustodiosApi
      .findAll()
      .then((rows) => setCustodios(rows ?? []))
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoriaId) {
      setError('Debe seleccionar una categoría.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await inventarioBienesApi.create({
        codigo: toOptional(formData.codigo),
        descripcion: formData.descripcion.trim(),
        marca: toOptional(formData.marca),
        modelo: toOptional(formData.modelo),
        serie: toOptional(formData.serie),
        fechaAdquisicion: formData.fechaAdquisicion,
        valorAdquisicion: Number(formData.valorAdquisicion),
        fuenteFinanciamiento: toOptional(formData.fuenteFinanciamiento),
        estadoConservacion: formData.estadoConservacion,
        ubicacion: toOptional(formData.ubicacion),
        valorResidual: formData.valorResidual.trim()
          ? Number(formData.valorResidual)
          : undefined,
        vidaUtilMesesOverride: formData.vidaUtilMesesOverride.trim()
          ? Number(formData.vidaUtilMesesOverride)
          : undefined,
        categoriaId: Number(formData.categoriaId),
        custodioId: formData.custodioId ? Number(formData.custodioId) : undefined,
      });
      router.push('/inventario/bienes');
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar el bien');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo bien</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registrar (dar de alta) un bien institucional en el inventario.
          </p>
        </div>
        <Link
          href="/inventario/bienes"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Datos del bien</h2>
          </header>
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Código (placa)</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Se autogenera si se deja vacío"
                  value={formData.codigo}
                  onChange={(e) => set('codigo', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Categoría *</label>
                <select
                  className={INPUT_CLS}
                  required
                  value={formData.categoriaId}
                  onChange={(e) => set('categoriaId', e.target.value)}
                >
                  <option value="">Seleccione…</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Descripción *</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  required
                  placeholder="Computadora de escritorio HP"
                  value={formData.descripcion}
                  onChange={(e) => set('descripcion', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Marca</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="HP"
                  value={formData.marca}
                  onChange={(e) => set('marca', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Modelo</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="ProDesk 600 G6"
                  value={formData.modelo}
                  onChange={(e) => set('modelo', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Serie</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="SN-123456"
                  value={formData.serie}
                  onChange={(e) => set('serie', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Estado de conservación</label>
                <select
                  className={INPUT_CLS}
                  value={formData.estadoConservacion}
                  onChange={(e) => set('estadoConservacion', e.target.value)}
                >
                  {ESTADOS_CONSERVACION.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Fecha de adquisición *</label>
                <input
                  type="date"
                  className={INPUT_CLS}
                  required
                  value={formData.fechaAdquisicion}
                  onChange={(e) => set('fechaAdquisicion', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Valor de adquisición *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={INPUT_CLS}
                  required
                  placeholder="850.00"
                  value={formData.valorAdquisicion}
                  onChange={(e) => set('valorAdquisicion', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Fuente de financiamiento</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Recursos propios"
                  value={formData.fuenteFinanciamiento}
                  onChange={(e) => set('fuenteFinanciamiento', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Ubicación</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Secretaría"
                  value={formData.ubicacion}
                  onChange={(e) => set('ubicacion', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Custodio</label>
                <select
                  className={INPUT_CLS}
                  value={formData.custodioId}
                  onChange={(e) => set('custodioId', e.target.value)}
                >
                  <option value="">Sin custodio</option>
                  {custodios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Valor residual (override)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={INPUT_CLS}
                  placeholder="Por defecto: % de la categoría"
                  value={formData.valorResidual}
                  onChange={(e) => set('valorResidual', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Vida útil en meses (override)</label>
                <input
                  type="number"
                  min="1"
                  className={INPUT_CLS}
                  placeholder="Por defecto: vida útil de la categoría"
                  value={formData.vidaUtilMesesOverride}
                  onChange={(e) => set('vidaUtilMesesOverride', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Link
                href="/inventario/bienes"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Guardando…
                  </>
                ) : (
                  <>
                    <i className="ti ti-check" /> Guardar
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Información</h2>
          </header>
          <div className="p-5 text-sm text-slate-600">
            <p className="text-slate-500">
              Al registrar el bien se crea automáticamente un movimiento de
              <strong className="text-slate-700"> alta</strong> en su historial.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              <li>
                <strong className="text-slate-700">Código:</strong> si se deja
                vacío se autogenera con el patrón BN-AAAA-NNNN.
              </li>
              <li>
                <strong className="text-slate-700">Depreciación:</strong> usa la
                vida útil y el % residual de la categoría (CGE 406-03), salvo que
                indique overrides.
              </li>
              <li>
                <strong className="text-slate-700">Custodio:</strong> puede
                asignarse luego desde la ficha del bien.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
