'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { personasApi } from '@/lib/api';
import { DatePicker, Select } from '@/components/ui';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function onlyLetters(value: string) {
  return value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.'-]/g, '');
}

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export default function CreatePersonaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    tipoIdentificacion: 'CED',
    numeroIdentificacion: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    genero: '',
    estadoCivil: '',
    profesion: '',
    nacionalidad: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await personasApi.create({
        tipoIdentificacion: formData.tipoIdentificacion,
        numeroIdentificacion: formData.numeroIdentificacion.trim(),
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: normalizeOptional(formData.email),
        telefono: normalizeOptional(formData.telefono),
        direccion: normalizeOptional(formData.direccion),
        tipoPersona: 'Persona',
        fechaNacimiento: formData.fechaNacimiento || null,
        genero: normalizeOptional(formData.genero),
        estadoCivil: normalizeOptional(formData.estadoCivil),
        profesion: normalizeOptional(formData.profesion),
        nacionalidad: normalizeOptional(formData.nacionalidad),
      });
      router.push('/personas');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la persona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva Persona</h1>
          <p className="mt-1 text-sm text-slate-600">Registrar una nueva persona.</p>
        </div>
        <Link
          href="/personas"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Datos de la Persona</h2>
          </header>
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Select
                  label="Tipo de Identificación"
                  required
                  value={formData.tipoIdentificacion}
                  onChange={(e) => setFormData({ ...formData, tipoIdentificacion: e.target.value })}
                  options={[
                    { value: 'CED', label: 'Cédula' },
                    { value: 'RUC', label: 'RUC' },
                    { value: 'PAS', label: 'Pasaporte' },
                  ]}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Número de Identificación *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={INPUT_CLS}
                  required
                  value={formData.numeroIdentificacion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numeroIdentificacion: onlyDigits(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Nombres *</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: onlyLetters(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Apellidos *</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  required
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData({ ...formData, apellido: onlyLetters(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Email</label>
                <input
                  type="email"
                  className={INPUT_CLS}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Teléfono</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel"
                  className={INPUT_CLS}
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: onlyDigits(e.target.value) })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Dirección</label>
                <textarea
                  className={INPUT_CLS}
                  rows={2}
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>

              <DatePicker
                label="Fecha de Nacimiento"
                value={formData.fechaNacimiento}
                onChange={(iso) => setFormData({ ...formData, fechaNacimiento: iso })}
              />
              <div>
                <Select
                  label="Género"
                  value={formData.genero}
                  onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    { value: 'M', label: 'Masculino' },
                    { value: 'F', label: 'Femenino' },
                  ]}
                />
              </div>
              <div>
                <Select
                  label="Estado civil"
                  value={formData.estadoCivil}
                  onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    { value: 'Soltero/a', label: 'Soltero/a' },
                    { value: 'Casado/a', label: 'Casado/a' },
                    { value: 'Divorciado/a', label: 'Divorciado/a' },
                    { value: 'Viudo/a', label: 'Viudo/a' },
                    { value: 'Unión libre', label: 'Unión libre' },
                  ]}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Profesión</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={formData.profesion}
                  onChange={(e) => setFormData({ ...formData, profesion: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Nacionalidad</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={formData.nacionalidad}
                  onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Link
                href="/personas"
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
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />{' '}
                    Guardar
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
            <p className="text-slate-500">La persona puede ser registrada como:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              <li>
                <strong className="text-slate-700">Propietario:</strong> Dueño de una bóveda
              </li>
              <li>
                <strong className="text-slate-700">Responsable:</strong> Persona de contacto
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
