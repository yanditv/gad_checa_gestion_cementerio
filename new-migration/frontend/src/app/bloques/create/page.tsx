'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bloquesApi, cementeriosApi } from '@/lib/api';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function CreateBloquePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cementerios, setCementerios] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cementerioId: '',
    numeroPisos: 1,
  });

  const validateForm = () => {
    const nombre = formData.nombre.trim();
    const descripcion = formData.descripcion.trim();
    const numeroPisos = Number(formData.numeroPisos);

    if (!nombre) return 'El nombre del bloque es obligatorio';
    if (nombre.length < 2) return 'El nombre del bloque debe tener al menos 2 caracteres';
    if (nombre.length > 80) return 'El nombre del bloque no puede exceder 80 caracteres';
    if (!formData.cementerioId) return 'Seleccione un cementerio';
    if (descripcion.length > 200) return 'La descripción no puede exceder 200 caracteres';
    if (!Number.isInteger(numeroPisos) || numeroPisos < 0) {
      return 'El número de pisos debe ser un entero mayor o igual a 0';
    }
    if (numeroPisos > 50) return 'El número de pisos no puede ser mayor a 50';
    return '';
  };

  useEffect(() => {
    const loadCementerios = async () => {
      try {
        const data = await cementeriosApi.findAll();
        setCementerios(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, cementerioId: String(data[0].id) }));
        }
      } catch {
        setError('No se pudieron cargar los cementerios');
      }
    };

    loadCementerios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    setError(validationError);
    if (validationError) return;
    setLoading(true);

    try {
      await bloquesApi.create({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        cementerioId: Number(formData.cementerioId),
        numeroPisos: Number(formData.numeroPisos) || 0,
      });
      router.push('/bloques');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el bloque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Bloque</h1>
          <p className="mt-1 text-sm text-slate-500">Registrar un nuevo bloque.</p>
        </div>
        <Link
          href="/bloques"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Datos del Bloque</h2>
          </header>
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Nombre *</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Ej: Bloque A"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Cementerio *</label>
                <select
                  className={INPUT_CLS}
                  required
                  value={formData.cementerioId}
                  onChange={(e) => setFormData({ ...formData, cementerioId: e.target.value })}
                >
                  <option value="">Seleccionar cementerio...</option>
                  {cementerios.map((cementerio) => (
                    <option key={cementerio.id} value={cementerio.id}>
                      {cementerio.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Descripción</label>
                <textarea
                  className={INPUT_CLS}
                  rows={3}
                  placeholder="Descripción del bloque..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Número de pisos</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  className={INPUT_CLS}
                  value={formData.numeroPisos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numeroPisos: Number(e.target.value),
                    })
                  }
                />
                <p className="mt-1 text-xs text-slate-500">
                  Se crearán automáticamente los pisos 1…N al guardar.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Link
                href="/bloques"
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
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
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
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Información</h2>
          </header>
          <div className="p-5 text-sm text-slate-600">
            Ingrese los datos del bloque. Los campos marcados con * son obligatorios.
          </div>
        </section>
      </div>
    </div>
  );
}
