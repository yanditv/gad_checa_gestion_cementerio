'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Boxes,
  Check,
  CircleDollarSign,
  Info,
  Layers3,
  Loader2,
  MapPin,
  PackageCheck,
  Users,
} from 'lucide-react';
import { bloquesApi, bovedasApi, tiposEspacioApi, TipoEspacio } from '@/lib/api';
import { Select } from '@/components/ui';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600';

export default function CreateBovedaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bloques, setBloques] = useState<any[]>([]);
  const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
  const [formData, setFormData] = useState({
    numero: '',
    bloqueId: '',
    tipoEspacioId: '',
    capacidad: '1',
    precio: '',
    precioArrendamiento: '',
    ubicacion: '',
    observaciones: '',
    estado: true,
  });

  const bloqueSeleccionado = bloques.find((bloque) => bloque.id === Number(formData.bloqueId));
  const tipoSeleccionado = tiposEspacio.find((tipo) => tipo.id === Number(formData.tipoEspacioId));

  const loadAllBloques = async () => {
    const items: any[] = [];
    let page = 1;

    while (true) {
      const result = await bloquesApi.findPage({ page, limit: 100 });
      items.push(...(result.data || []));
      const totalPages = result.meta?.totalPages ?? 1;
      if (page >= totalPages) break;
      page += 1;
    }

    return items;
  };

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
    if (!formData.tipoEspacioId) return 'Seleccione un tipo de espacio';
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
        const [data, tipos] = await Promise.all([
          loadAllBloques(),
          tiposEspacioApi.findAll(),
        ]);
        setBloques(data.filter((b: any) => b.estado));
        setTiposEspacio(Array.isArray(tipos) ? tipos : []);
      } catch (err) {
        setBloques([]);
        setTiposEspacio([]);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    setError(validationError);
    if (validationError) return;
    setLoading(true);
    try {
      await bovedasApi.create({
        ...formData,
        numero: formData.numero.trim(),
        bloqueId: Number(formData.bloqueId),
        tipoEspacioId: Number(formData.tipoEspacioId),
        capacidad: Number(formData.capacidad),
        precio: Number(formData.precio || 0),
        precioArrendamiento: Number(formData.precioArrendamiento || 0),
        ubicacion: formData.ubicacion.trim() || undefined,
        observaciones: formData.observaciones.trim() || undefined,
      });
      router.push('/bovedas');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la bóveda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva Bóveda</h1>
          <p className="mt-1 text-sm text-slate-600">Registrar una nueva bóveda.</p>
        </div>
        <Link
          href="/bovedas"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
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
                <label className={LABEL_CLS}>Número de Bóveda *</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Ej: B001"
                  required
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                />
              </div>
              <div>
                <Select
                  label="Bloque"
                  required
                  value={formData.bloqueId}
                  onChange={(e) => setFormData({ ...formData, bloqueId: e.target.value })}
                  options={[
                    { value: '', label: 'Seleccionar bloque...' },
                    ...bloques.map((bloque) => ({
                      value: bloque.id,
                      label: bloque.nombre,
                    })),
                  ]}
                />
              </div>

              <div>
                <Select
                  label="Tipo"
                  required
                  value={formData.tipoEspacioId}
                  onChange={(e) => setFormData({ ...formData, tipoEspacioId: e.target.value })}
                  options={[
                    { value: '', label: 'Seleccionar tipo...' },
                    ...tiposEspacio.map((tipo) => ({
                      value: tipo.id,
                      label: tipo.nombre,
                    })),
                  ]}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Capacidad *</label>
                <input
                  type="number"
                  className={INPUT_CLS}
                  placeholder="Número de cuerpos"
                  min="1"
                  required
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Precio de Venta</label>
                <input
                  type="number"
                  className={INPUT_CLS}
                  placeholder="0.00"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Precio de Arrendamiento</label>
                <input
                  type="number"
                  className={INPUT_CLS}
                  placeholder="0.00"
                  step="0.01"
                  value={formData.precioArrendamiento}
                  onChange={(e) => setFormData({ ...formData, precioArrendamiento: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Ubicación</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Descripción de la ubicación"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Observaciones</label>
                <textarea
                  className={INPUT_CLS}
                  rows={3}
                  placeholder="Observaciones adicionales..."
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-300"
                    checked={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                  />
                  Bóveda disponible para arrendar
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Link
                href="/bovedas"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Guardar
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <section className="self-start overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Info className="h-4 w-4 text-primary-600" strokeWidth={2} aria-hidden="true" />
              Información
            </h2>
          </header>
          <div className="space-y-4 p-5 text-sm text-slate-600">
            <div className="rounded-lg border border-primary-100 bg-primary-50/70 p-3">
              <div className="flex items-start gap-2">
                <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" strokeWidth={2} aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-800">
                    {formData.numero.trim() || 'Bóveda sin número'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {bloqueSeleccionado?.nombre || 'Selecciona un bloque'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <Layers3 className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Tipo
                </div>
                <p className="mt-2 font-semibold text-slate-800">
                  {tipoSeleccionado?.nombre || '—'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <Users className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Capacidad
                </div>
                <p className="mt-2 text-lg font-bold text-slate-800">{formData.capacidad}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <CircleDollarSign className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Venta
                </div>
                <p className="mt-2 font-semibold text-slate-800">
                  ${Number(formData.precio || 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <PackageCheck className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Arriendo
                </div>
                <p className="mt-2 font-semibold text-slate-800">
                  ${Number(formData.precioArrendamiento || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-white p-3">
              <div className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} aria-hidden="true" />
                <p>
                  Los campos marcados con <span className="font-semibold text-red-500">*</span> son obligatorios.
                  Si marcas la bóveda como disponible, podrá usarse en contratos de arriendo.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tipos de espacio
              </p>
              {tiposEspacio.length === 0 ? (
                <p className="text-xs text-slate-600">
                  No hay tipos de espacio configurados. Créelos en Parámetros.
                </p>
              ) : (
                <ul className="space-y-2">
                  {tiposEspacio.map((tipo) => (
                    <li
                      key={tipo.id}
                      className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2"
                    >
                      <span className="font-medium text-slate-700">{tipo.nombre}</span>
                      <span className="text-xs text-slate-500">
                        ${Number(tipo.tarifaArriendo).toFixed(2)} · {tipo.aniosArriendo} año
                        {tipo.aniosArriendo === 1 ? '' : 's'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
