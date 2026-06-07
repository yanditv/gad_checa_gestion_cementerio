'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { bloquesApi, bovedasApi } from '@/lib/api';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function EditBovedaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bloques, setBloques] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    numero: '',
    bloqueId: '',
    tipo: 'Boveda',
    capacidad: '1',
    precio: '',
    precioArrendamiento: '',
    ubicacion: '',
    observaciones: '',
    estado: true,
  });

  const validateForm = () => {
    const numero = formData.numero.trim();
    const ubicacion = formData.ubicacion.trim();
    const observaciones = formData.observaciones.trim();
    const capacidad = Number(formData.capacidad);
    const precio = Number(formData.precio || 0);
    const precioArrendamiento = Number(formData.precioArrendamiento || 0);

    if (!numero) return 'El número de la bóveda es obligatorio';
    if (numero.length > 30) return 'El número de la bóveda no puede exceder 30 caracteres';
    if (!formData.bloqueId) return 'Seleccione un bloque';
    if (!['Boveda', 'Nicho', 'Mausoleo'].includes(formData.tipo)) return 'Seleccione un tipo válido';
    if (!Number.isInteger(capacidad) || capacidad < 1) return 'La capacidad debe ser un entero mayor o igual a 1';
    if (capacidad > 20) return 'La capacidad no puede ser mayor a 20';
    if (Number.isNaN(precio) || precio < 0) return 'El precio no puede ser negativo';
    if (Number.isNaN(precioArrendamiento) || precioArrendamiento < 0) return 'El precio de arrendamiento no puede ser negativo';
    if (ubicacion.length > 150) return 'La ubicación no puede exceder 150 caracteres';
    if (observaciones.length > 300) return 'Las observaciones no pueden exceder 300 caracteres';
    return '';
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [boveda, bloquesData] = await Promise.all([
          bovedasApi.findOne(Number(params.id)),
          bloquesApi.findPage({ page: 1, limit: 100 }),
        ]);

        setBloques((bloquesData.data || []).filter((b: any) => b.estado));
        setFormData({
          numero: boveda.numero || '',
          bloqueId: boveda.bloqueId?.toString() || '',
          tipo: boveda.tipo || 'Boveda',
          capacidad: boveda.capacidad?.toString() || '1',
          precio: boveda.precio?.toString() || '',
          precioArrendamiento: boveda.precioArrendamiento?.toString() || '',
          ubicacion: boveda.ubicacion || '',
          observaciones: boveda.observaciones || '',
          estado: !!boveda.estado,
        });
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    setError(validationError);
    if (validationError) return;
    setSaving(true);

    try {
      await bovedasApi.update(Number(params.id), {
        ...formData,
        numero: formData.numero.trim(),
        bloqueId: Number(formData.bloqueId),
        capacidad: Number(formData.capacidad),
        precio: Number(formData.precio || 0),
        precioArrendamiento: Number(formData.precioArrendamiento || 0),
        ubicacion: formData.ubicacion.trim() || undefined,
        observaciones: formData.observaciones.trim() || undefined,
      });
      router.push(`/bovedas/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la bóveda');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <svg
          className="h-6 w-6 animate-spin text-primary-500"
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Bóveda</h1>
          <p className="mt-1 text-sm text-slate-500">Actualizar datos de la bóveda.</p>
        </div>
        <Link
          href={`/bovedas/${params.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Datos de la Bóveda</h2>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS}>Número *</label>
              <input
                type="text"
                className={INPUT_CLS}
                required
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Bloque *</label>
              <select
                className={INPUT_CLS}
                required
                value={formData.bloqueId}
                onChange={(e) => setFormData({ ...formData, bloqueId: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {bloques.map((bloque) => (
                  <option key={bloque.id} value={bloque.id}>
                    {bloque.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LABEL_CLS}>Tipo</label>
              <select
                className={INPUT_CLS}
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              >
                <option value="Boveda">Bóveda</option>
                <option value="Nicho">Nicho</option>
                <option value="Mausoleo">Mausoleo</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Capacidad *</label>
              <input
                type="number"
                className={INPUT_CLS}
                min="1"
                required
                value={formData.capacidad}
                onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Estado</label>
              <select
                className={INPUT_CLS}
                value={formData.estado ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value === 'true' })}
              >
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS}>Precio</label>
              <input
                type="number"
                step="0.01"
                className={INPUT_CLS}
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Precio Arrendamiento</label>
              <input
                type="number"
                step="0.01"
                className={INPUT_CLS}
                value={formData.precioArrendamiento}
                onChange={(e) =>
                  setFormData({ ...formData, precioArrendamiento: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Ubicación</label>
            <input
              type="text"
              className={INPUT_CLS}
              value={formData.ubicacion}
              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Observaciones</label>
            <textarea
              className={INPUT_CLS}
              rows={3}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Link
              href={`/bovedas/${params.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
