'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { inventarioCategoriasApi } from '@/lib/api';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

interface FormState {
  nombre: string;
  vidaUtilAnios: string;
  valorResidualPct: string;
  estado: boolean;
}

export default function EditCategoriaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    vidaUtilAnios: '',
    valorResidualPct: '',
    estado: true,
  });

  useEffect(() => {
    inventarioCategoriasApi
      .findOne(id)
      .then((data) =>
        setFormData({
          nombre: data.nombre ?? '',
          vidaUtilAnios: String(data.vidaUtilAnios ?? ''),
          valorResidualPct: String(data.valorResidualPct ?? ''),
          estado: data.estado ?? true,
        }),
      )
      .catch((err: any) =>
        setError(err.message || 'No se pudo cargar la categoría'),
      )
      .finally(() => setFetching(false));
  }, [id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await inventarioCategoriasApi.update(id, {
        nombre: formData.nombre.trim(),
        vidaUtilAnios: Number(formData.vidaUtilAnios),
        valorResidualPct:
          formData.valorResidualPct.trim() === ''
            ? undefined
            : Number(formData.valorResidualPct),
        estado: formData.estado,
      });
      router.push('/inventario/categorias');
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar categoría</h1>
          <p className="mt-1 text-sm text-slate-500">
            Actualizar vida útil y valor residual.
          </p>
        </div>
        <Link
          href="/inventario/categorias"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

      {fetching ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-400 shadow-soft">
          <div className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Cargando categoría…
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Datos de la categoría
              </h2>
            </header>
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Nombre *</label>
                  <input
                    type="text"
                    className={INPUT_CLS}
                    required
                    value={formData.nombre}
                    onChange={(e) => set('nombre', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Vida útil (años) *</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className={INPUT_CLS}
                    required
                    value={formData.vidaUtilAnios}
                    onChange={(e) => set('vidaUtilAnios', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Valor residual (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    className={INPUT_CLS}
                    value={formData.valorResidualPct}
                    onChange={(e) => set('valorResidualPct', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.estado}
                      onChange={(e) => set('estado', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-200"
                    />
                    Categoría activa
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Link
                  href="/inventario/categorias"
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
                Cambiar la vida útil o el valor residual afecta el cálculo de
                depreciación de los bienes asociados a esta categoría.
              </p>
              <p className="mt-2 text-slate-500">
                Desmarca <strong className="text-slate-700">Categoría activa</strong>{' '}
                para ocultarla sin eliminarla.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
