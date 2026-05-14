'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bovedasApi, difuntosApi } from '@/lib/api';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function CreateDifuntoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bovedas, setBovedas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    numeroIdentificacion: '',
    fechaNacimiento: '',
    edad: '',
    fechaDefuncion: '',
    fechaInhumacion: '',
    genero: '',
    causaMuerte: '',
    bovedaId: '',
    observaciones: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await bovedasApi.findAll();
        setBovedas(data.filter((b: any) => b.estado));
      } catch (err) {
        setBovedas([]);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await difuntosApi.create({
        ...formData,
        edad: formData.edad ? Number(formData.edad) : null,
        bovedaId: Number(formData.bovedaId),
        fechaNacimiento: formData.fechaNacimiento || null,
        fechaDefuncion: formData.fechaDefuncion || null,
        fechaInhumacion: formData.fechaInhumacion || null,
      });
      router.push('/difuntos');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el difunto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Difunto</h1>
          <p className="mt-1 text-sm text-slate-500">Registrar un nuevo difunto.</p>
        </div>
        <Link
          href="/difuntos"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Datos del Difunto</h2>
          </header>
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Nombres *</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Apellidos *</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  required
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Tipo de Identificación</label>
                <select className={INPUT_CLS}>
                  <option value="CED">Cédula</option>
                  <option value="RUC">RUC</option>
                  <option value="PAS">Pasaporte</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Número de Identificación</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={formData.numeroIdentificacion}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroIdentificacion: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Fecha de Nacimiento</label>
                <input
                  type="date"
                  className={INPUT_CLS}
                  value={formData.fechaNacimiento}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaNacimiento: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Edad</label>
                <input
                  type="number"
                  className={INPUT_CLS}
                  value={formData.edad}
                  onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Fecha de Defunción *</label>
                <input
                  type="date"
                  className={INPUT_CLS}
                  required
                  value={formData.fechaDefuncion}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaDefuncion: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Fecha de Inhumación *</label>
                <input
                  type="date"
                  className={INPUT_CLS}
                  required
                  value={formData.fechaInhumacion}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaInhumacion: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Género</label>
                <select
                  className={INPUT_CLS}
                  value={formData.genero}
                  onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Causa de Muerte</label>
                <select
                  className={INPUT_CLS}
                  value={formData.causaMuerte}
                  onChange={(e) => setFormData({ ...formData, causaMuerte: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  <option value="CA">Causa Natural</option>
                  <option value="AC">Accidente</option>
                  <option value="EN">Enfermedad</option>
                  <option value="OT">Otro</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Bóveda *</label>
                <select
                  className={INPUT_CLS}
                  required
                  value={formData.bovedaId}
                  onChange={(e) => setFormData({ ...formData, bovedaId: e.target.value })}
                >
                  <option value="">Seleccionar bóveda...</option>
                  {bovedas.map((boveda) => (
                    <option key={boveda.id} value={boveda.id}>
                      {boveda.numero} - {boveda.bloque?.nombre || 'Sin bloque'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Observaciones</label>
                <textarea
                  className={INPUT_CLS}
                  rows={3}
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Link
                href="/difuntos"
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
            Complete los datos del difunto. Los campos marcados con * son obligatorios.
          </div>
        </section>
      </div>
    </div>
  );
}
