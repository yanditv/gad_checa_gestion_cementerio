'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Check,
  DollarSign,
  Grid3X3,
  Info,
  Layers3,
  Loader2,
  Route,
} from 'lucide-react';
import { bloquesApi, cementeriosApi } from '@/lib/api';
import { Select } from '@/components/ui';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600';

export default function CreateBloquePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cementerios, setCementerios] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cementerioId: '',
    tipo: 'Bovedas',
    tarifaBase: 0,
    numeroPisos: 1,
    bovedasPorPiso: 0,
  });

  const [preciosPorPiso, setPreciosPorPiso] = useState<{ [key: number]: { usarTarifaBase: boolean; precio: number } }>({});

  const cementerioSeleccionado = useMemo(
    () => cementerios.find((c) => c.id === Number(formData.cementerioId)),
    [cementerios, formData.cementerioId],
  );

  // Actualizar tarifa base cuando cambia cementerio o tipo
  useEffect(() => {
    if (cementerioSeleccionado) {
      const tarifa = formData.tipo === 'Nichos'
        ? (cementerioSeleccionado.tarifaArriendoNicho ?? 0)
        : (cementerioSeleccionado.tarifaArriendo ?? 0);
      setFormData((prev) => ({ ...prev, tarifaBase: Number(tarifa) || 0 }));
    }
  }, [formData.cementerioId, formData.tipo]);

  // Inicializar preciosPorPiso cuando cambia numeroPisos
  useEffect(() => {
    const n = Number(formData.numeroPisos);
    setPreciosPorPiso((prev) => {
      const next: typeof prev = {};
      for (let i = 1; i <= n; i++) {
        next[i] = prev[i] ?? { usarTarifaBase: true, precio: formData.tarifaBase };
      }
      return next;
    });
  }, [formData.numeroPisos]);

  // Actualizar precio cuando cambia tarifaBase
  useEffect(() => {
    setPreciosPorPiso((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(next)) {
        if (v.usarTarifaBase) {
          next[Number(k)] = { ...v, precio: formData.tarifaBase };
        }
      }
      return next;
    });
  }, [formData.tarifaBase]);

  const totalBovedas = Number(formData.numeroPisos) * Number(formData.bovedasPorPiso);

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
    if (Number(formData.bovedasPorPiso) < 0) return 'El número de bóvedas por piso no puede ser negativo';
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
        tipo: formData.tipo,
        tarifaBase: Number(formData.tarifaBase),
        numeroPisos: Number(formData.numeroPisos) || 0,
        bovedasPorPiso: Number(formData.bovedasPorPiso) || 0,
        preciosPorPiso: Object.entries(preciosPorPiso)
          .filter(([, v]) => !v.usarTarifaBase)
          .map(([k, v]) => ({ numeroPiso: Number(k), precio: v.precio })),
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
          <p className="mt-1 text-sm text-slate-600">Registrar un nuevo bloque con sus pisos y bóvedas.</p>
        </div>
        <Link
          href="/bloques"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
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
                <Select
                  label="Cementerio"
                  required
                  value={formData.cementerioId}
                  onChange={(e) => setFormData({ ...formData, cementerioId: e.target.value })}
                  options={[
                    { value: '', label: 'Seleccionar cementerio...' },
                    ...cementerios.map((cementerio) => ({
                      value: cementerio.id,
                      label: cementerio.nombre,
                    })),
                  ]}
                />
              </div>

              <div>
                <Select
                  label="Tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  options={[
                    { value: 'Bovedas', label: 'Bóvedas' },
                    { value: 'Nichos', label: 'Nichos' },
                  ]}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Tarifa Base ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className={INPUT_CLS}
                  value={formData.tarifaBase}
                  onChange={(e) => setFormData({ ...formData, tarifaBase: Number(e.target.value) })}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {cementerioSeleccionado
                    ? `Sugerido desde cementerio: $${Number(formData.tipo === 'Nichos' ? cementerioSeleccionado.tarifaArriendoNicho : cementerioSeleccionado.tarifaArriendo).toFixed(2)}`
                    : ''}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Descripción</label>
                <textarea
                  className={INPUT_CLS}
                  rows={2}
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
              </div>
              <div>
                <label className={LABEL_CLS}>Bóvedas por piso</label>
                <input
                  type="number"
                  min={0}
                  className={INPUT_CLS}
                  value={formData.bovedasPorPiso}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bovedasPorPiso: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Vista previa de pisos */}
            {Number(formData.numeroPisos) > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Vista previa — {formData.numeroPisos} piso{Number(formData.numeroPisos) !== 1 ? 's' : ''}
                  {Number(formData.bovedasPorPiso) > 0 && ` · ${totalBovedas} bóvedas en total`}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-slate-600">
                        <th className="px-3 py-2">Piso</th>
                        <th className="px-3 py-2">Bóvedas</th>
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
                            <td className="px-3 py-2 text-slate-600">{formData.bovedasPorPiso}</td>
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
                href="/bloques"
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
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
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
              Resumen
            </h2>
          </header>
          <div className="space-y-4 p-5 text-sm text-slate-600">
            <div className="rounded-lg border border-primary-100 bg-primary-50/70 p-3">
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" strokeWidth={2} aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-800">
                    {formData.nombre.trim() || 'Bloque sin nombre'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {cementerioSeleccionado?.nombre || 'Selecciona un cementerio'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <Layers3 className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Pisos
                </div>
                <p className="mt-2 text-lg font-bold text-slate-800">{formData.numeroPisos}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <Grid3X3 className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Por piso
                </div>
                <p className="mt-2 text-lg font-bold text-slate-800">{formData.bovedasPorPiso}</p>
              </div>
              <div className="rounded-lg border border-primary-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Total
                </p>
                <p className="mt-2 text-lg font-bold text-primary-700">{totalBovedas}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <DollarSign className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Tarifa
                </div>
                <p className="mt-2 text-lg font-bold text-slate-800">
                  ${Number(formData.tarifaBase).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tipo</p>
              <p className="mt-1 font-medium text-slate-800">
                {formData.tipo === 'Nichos' ? 'Nichos' : 'Bóvedas'}
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex gap-2">
                <Route className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} aria-hidden="true" />
                <p>
                  Si no especificas bóvedas por piso, solo se crearán los pisos.
                </p>
              </div>
              <div className="flex gap-2">
                <Grid3X3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} aria-hidden="true" />
                <p>
                  La numeración automática usa el formato piso-bóveda, por ejemplo 1-1, 1-2.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
