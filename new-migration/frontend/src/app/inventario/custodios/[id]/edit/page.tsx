'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { inventarioCustodiosApi } from '@/lib/api';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

interface FormState {
  nombre: string;
  identificacion: string;
  cargo: string;
  estado: boolean;
}

function toOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export default function EditCustodioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    identificacion: '',
    cargo: '',
    estado: true,
  });

  useEffect(() => {
    inventarioCustodiosApi
      .findOne(id)
      .then((data) =>
        setFormData({
          nombre: data.nombre ?? '',
          identificacion: data.identificacion ?? '',
          cargo: data.cargo ?? '',
          estado: data.estado ?? true,
        }),
      )
      .catch((err: any) =>
        setError(err.message || 'No se pudo cargar el custodio'),
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
      await inventarioCustodiosApi.update(id, {
        nombre: formData.nombre.trim(),
        identificacion: toOptional(formData.identificacion),
        cargo: toOptional(formData.cargo),
        estado: formData.estado,
      });
      router.push('/inventario/custodios');
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el custodio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar custodio</h1>
          <p className="mt-1 text-sm text-slate-500">
            Actualizar los datos del responsable de bienes.
          </p>
        </div>
        <Link
          href="/inventario/custodios"
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
            Cargando custodio…
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Datos del custodio
              </h2>
            </header>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-1">
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
                <label className={LABEL_CLS}>Identificación</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={formData.identificacion}
                  onChange={(e) => set('identificacion', e.target.value)}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Cargo</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={formData.cargo}
                  onChange={(e) => set('cargo', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={formData.estado}
                    onChange={(e) => set('estado', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-200"
                  />
                  Custodio activo
                </label>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Link
              href="/inventario/custodios"
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
      )}
    </div>
  );
}
