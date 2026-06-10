'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { inventarioCustodiosApi } from '@/lib/api';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

interface FormState {
  nombre: string;
  identificacion: string;
  cargo: string;
}

const INITIAL: FormState = {
  nombre: '',
  identificacion: '',
  cargo: '',
};

function toOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export default function CreateCustodioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>(INITIAL);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await inventarioCustodiosApi.create({
        nombre: formData.nombre.trim(),
        identificacion: toOptional(formData.identificacion),
        cargo: toOptional(formData.cargo),
      });
      router.push('/inventario/custodios');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el custodio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo custodio</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registrar un responsable de bienes del inventario.
          </p>
        </div>
        <Link
          href="/inventario/custodios"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

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
                placeholder="Juan Pérez"
                value={formData.nombre}
                onChange={(e) => set('nombre', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Identificación</label>
              <input
                type="text"
                className={INPUT_CLS}
                placeholder="0102030405"
                value={formData.identificacion}
                onChange={(e) => set('identificacion', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Cargo</label>
              <input
                type="text"
                className={INPUT_CLS}
                placeholder="Secretario"
                value={formData.cargo}
                onChange={(e) => set('cargo', e.target.value)}
              />
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
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
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
    </div>
  );
}
