'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { personasApi } from '@/lib/api';
import { DatePicker } from '@/components/ui';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function EditPersonaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    const loadPersona = async () => {
      try {
        const persona = await personasApi.findOne(Number(params.id));
        setFormData({
          tipoIdentificacion: persona.tipoIdentificacion || 'CED',
          numeroIdentificacion: persona.numeroIdentificacion || '',
          nombre: persona.nombre || '',
          apellido: persona.apellido || '',
          email: persona.email || '',
          telefono: persona.telefono || '',
          direccion: persona.direccion || '',
          fechaNacimiento: persona.fechaNacimiento ? new Date(persona.fechaNacimiento).toISOString().split('T')[0] : '',
          genero: persona.genero || '',
          estadoCivil: persona.estadoCivil || '',
          profesion: persona.profesion || '',
          nacionalidad: persona.nacionalidad || '',
        });
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la persona');
      } finally {
        setLoading(false);
      }
    };

    loadPersona();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await personasApi.update(Number(params.id), {
        ...formData,
        fechaNacimiento: formData.fechaNacimiento || null,
      });
      router.push(`/personas/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la persona');
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Persona</h1>
          <p className="mt-1 text-sm text-slate-500">Actualizar datos de la persona.</p>
        </div>
        <Link
          href={`/personas/${params.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
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
              <label className={LABEL_CLS}>Tipo de Identificación *</label>
              <select
                className={INPUT_CLS}
                required
                value={formData.tipoIdentificacion}
                onChange={(e) => setFormData({ ...formData, tipoIdentificacion: e.target.value })}
              >
                <option value="CED">Cédula</option>
                <option value="RUC">RUC</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Número de Identificación *</label>
              <input
                type="text"
                className={INPUT_CLS}
                required
                value={formData.numeroIdentificacion}
                onChange={(e) => setFormData({ ...formData, numeroIdentificacion: e.target.value })}
              />
            </div>
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
                className={INPUT_CLS}
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
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
                <label className={LABEL_CLS}>Estado civil</label>
                <select
                  className={INPUT_CLS}
                  value={formData.estadoCivil}
                  onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="Divorciado/a">Divorciado/a</option>
                  <option value="Viudo/a">Viudo/a</option>
                  <option value="Unión libre">Unión libre</option>
                </select>
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
              href={`/personas/${params.id}`}
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
