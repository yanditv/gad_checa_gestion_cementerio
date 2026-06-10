'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { bloquesApi } from '@/lib/api';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function EditBloquePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [bloqueId, setBloqueId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notFoundState, setNotFoundState] = useState(false);
  const [pisosActuales, setPisosActuales] = useState(0);
  const [preciosPorPiso, setPreciosPorPiso] = useState<{ [key: number]: { usarTarifaBase: boolean; precio: number } }>({});
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'Bovedas',
    tarifaBase: 0,
    estado: true,
    numeroPisos: 0,
    bovedasPorPiso: 0,
  });

  const validateForm = () => {
    const nombre = formData.nombre.trim();
    const descripcion = formData.descripcion.trim();
    const numeroPisos = Number(formData.numeroPisos);

    if (!nombre) return 'El nombre del bloque es obligatorio';
    if (nombre.length < 2) return 'El nombre del bloque debe tener al menos 2 caracteres';
    if (nombre.length > 80) return 'El nombre del bloque no puede exceder 80 caracteres';
    if (descripcion.length > 200) return 'La descripción no puede exceder 200 caracteres';
    if (!Number.isInteger(numeroPisos) || numeroPisos < 0) return 'El número de pisos debe ser un entero mayor o igual a 0';
    if (numeroPisos > 50) return 'El número de pisos no puede ser mayor a 50';
    return '';
  };

  useEffect(() => {
    let active = true;

    (async () => {
      const id = Number(params.id);
      if (!Number.isFinite(id)) {
        if (active) {
          setNotFoundState(true);
          setLoading(false);
        }
        return;
      }

      setBloqueId(id);
      setLoading(true);
      setError('');
      try {
        const data = await bloquesApi.findOne(id);
        if (!active) return;
        setFormData({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          tipo: data.tipo || 'Bovedas',
          tarifaBase: Number(data.tarifaBase ?? 0),
          estado: Boolean(data.estado),
          numeroPisos: (data.pisos ?? []).length,
          bovedasPorPiso: data.bovedasPorPiso ?? 0,
        });
        setPisosActuales((data.pisos ?? []).length);
        const preciosIniciales: typeof preciosPorPiso = {};
        (data.pisos ?? []).forEach((p: any) => {
          preciosIniciales[p.numero] = {
            usarTarifaBase: Number(p.precio) === Number(data.tarifaBase),
            precio: Number(p.precio ?? data.tarifaBase ?? 0),
          };
        });
        setPreciosPorPiso(preciosIniciales);
      } catch (err: any) {
        if (err.message?.includes('404') || err.message?.includes('no encontrado')) {
          if (active) setNotFoundState(true);
          return;
        }
        if (active) setError(err.message || 'No se pudo cargar el bloque');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloqueId) return;
    const validationError = validateForm();
    setError(validationError);
    if (validationError) return;
    setSaving(true);
    try {
      await bloquesApi.update(bloqueId, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        tipo: formData.tipo,
        tarifaBase: Number(formData.tarifaBase) || undefined,
        estado: formData.estado,
        numeroPisos: Number(formData.numeroPisos),
        bovedasPorPiso: Number(formData.bovedasPorPiso) || undefined,
        preciosPorPiso: Object.entries(preciosPorPiso)
          .filter(([, v]) => !v.usarTarifaBase)
          .map(([k, v]) => ({ numeroPiso: Number(k), precio: v.precio })),
      });
      router.push(`/bloques/${bloqueId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el bloque');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-soft">Cargando bloque…</div>;
  }

  if (notFoundState) {
    return (
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-xl font-semibold text-slate-900">Bloque no encontrado</h1>
        <p className="text-sm text-slate-600">No se puede editar un bloque inexistente.</p>
        <div>
          <Link href="/bloques" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600">
            <i className="ti ti-arrow-left" /> Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Bloque</h1>
          <p className="mt-1 text-sm text-slate-500">Actualice los datos básicos del bloque.</p>
        </div>
        <Link
          href={bloqueId ? `/bloques/${bloqueId}` : '/bloques'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Datos del bloque</h2>
          </header>
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Nombre *</label>
                <input
                  type="text"
                  required
                  className={INPUT_CLS}
                  value={formData.nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Estado</label>
                <select
                  className={INPUT_CLS}
                  value={formData.estado ? 'activo' : 'inactivo'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.value === 'activo' }))}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>Tipo</label>
                <select
                  className={INPUT_CLS}
                  value={formData.tipo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value }))}
                >
                  <option value="Bovedas">Bóvedas</option>
                  <option value="Nichos">Nichos</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Tarifa Base ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className={INPUT_CLS}
                  value={formData.tarifaBase}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tarifaBase: Number(e.target.value) }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, numeroPisos: Number(e.target.value) }))}
                />
                {formData.numeroPisos !== pisosActuales && (
                  <p className="mt-1 text-xs text-amber-600">
                    {formData.numeroPisos > pisosActuales
                      ? `Se crearán ${formData.numeroPisos - pisosActuales} piso(s) nuevo(s).`
                      : `Se desactivarán ${pisosActuales - formData.numeroPisos} piso(s).`}
                    {formData.numeroPisos < pisosActuales && ' Si tienen bóvedas con contratos, el cambio será rechazado.'}
                  </p>
                )}
              </div>
              <div>
                <label className={LABEL_CLS}>Bóvedas por piso</label>
                <input
                  type="number"
                  min={0}
                  className={INPUT_CLS}
                  value={formData.bovedasPorPiso}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bovedasPorPiso: Number(e.target.value) }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Descripción</label>
                <textarea
                  rows={3}
                  className={INPUT_CLS}
                  value={formData.descripcion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                />
              </div>
            </div>

            {/* Vista previa de precios por piso */}
            {Number(formData.numeroPisos) > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Precios por piso — {formData.numeroPisos} piso{Number(formData.numeroPisos) !== 1 ? 's' : ''}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-slate-500">
                        <th className="px-3 py-2">Piso</th>
                        <th className="px-3 py-2">Usar tarifa base</th>
                        <th className="px-3 py-2">Precio personalizado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Number(formData.numeroPisos) }, (_, i) => i + 1).map((pisoNum) => {
                        const cfg = preciosPorPiso[pisoNum] ?? { usarTarifaBase: true, precio: formData.tarifaBase };
                        return (
                          <tr key={pisoNum} className="border-t border-slate-200">
                            <td className="px-3 py-2 font-medium">Piso {pisoNum}</td>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={cfg.usarTarifaBase}
                                onChange={() => {
                                  setPreciosPorPiso((prev) => ({
                                    ...prev,
                                    [pisoNum]: {
                                      usarTarifaBase: !cfg.usarTarifaBase,
                                      precio: cfg.usarTarifaBase ? cfg.precio : formData.tarifaBase,
                                    },
                                  }));
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-primary-500"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                disabled={cfg.usarTarifaBase}
                                className={`w-32 rounded border border-slate-200 px-2 py-1 text-sm ${cfg.usarTarifaBase ? 'bg-slate-100 text-slate-400' : 'bg-white'}`}
                                value={cfg.precio}
                                onChange={(e) => {
                                  setPreciosPorPiso((prev) => ({
                                    ...prev,
                                    [pisoNum]: { ...cfg, precio: Number(e.target.value) },
                                  }));
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Link
                href={bloqueId ? `/bloques/${bloqueId}` : '/bloques'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
              >
                <i className={`ti ${saving ? 'ti-loader animate-spin' : 'ti-check'}`} />
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Alcance</h2>
          </header>
          <div className="space-y-3 p-5 text-sm text-slate-600">
            <p>Edite los datos del bloque. Los cambios en número de pisos pueden crear o eliminar pisos (con validación de contratos activos).</p>
            <p>Los precios por piso se pueden personalizar desmarcando "Usar tarifa base" en la tabla inferior.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
