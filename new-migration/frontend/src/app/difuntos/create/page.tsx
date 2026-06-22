'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { bovedasApi, difuntosApi } from '@/lib/api';
import { Button, ImageUpload, Select } from '@/components/ui';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600';

interface FormState {
  nombre: string;
  apellido: string;
  numeroIdentificacion: string;
  fechaNacimiento: string;
  fechaDefuncion: string;
  fechaInhumacion: string;
  genero: string;
  causaMuerte: string;
  bovedaId: string;
  observaciones: string;
  nacionalidad: string;
  estadoCivil: string;
  lugarNacimiento: string;
  lugarDefuncion: string;
  nombreConyuge: string;
  nombrePadre: string;
  nombreMadre: string;
  numeroCertificadoDefuncion: string;
  entidadEmisora: string;
  fechaEmisionCertificado: string;
}

const INITIAL: FormState = {
  nombre: '',
  apellido: '',
  numeroIdentificacion: '',
  fechaNacimiento: '',
  fechaDefuncion: '',
  fechaInhumacion: '',
  genero: '',
  causaMuerte: '',
  bovedaId: '',
  observaciones: '',
  nacionalidad: '',
  estadoCivil: '',
  lugarNacimiento: '',
  lugarDefuncion: '',
  nombreConyuge: '',
  nombrePadre: '',
  nombreMadre: '',
  numeroCertificadoDefuncion: '',
  entidadEmisora: '',
  fechaEmisionCertificado: '',
};

function toOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export default function CreateDifuntoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bovedas, setBovedas] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormState>(INITIAL);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  useEffect(() => {
    bovedasApi
      .findAll()
      .then((data) => setBovedas(data.filter((b: any) => b.estado)))
      .catch(() => setBovedas([]));
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const creado = await difuntosApi.create({
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        bovedaId: Number(formData.bovedaId),
        numeroIdentificacion: toOptional(formData.numeroIdentificacion),
        fechaNacimiento: toOptional(formData.fechaNacimiento),
        fechaDefuncion: toOptional(formData.fechaDefuncion),
        fechaInhumacion: toOptional(formData.fechaInhumacion),
        genero: toOptional(formData.genero),
        causaMuerte: toOptional(formData.causaMuerte),
        observaciones: toOptional(formData.observaciones),
        nacionalidad: toOptional(formData.nacionalidad),
        estadoCivil: toOptional(formData.estadoCivil),
        lugarNacimiento: toOptional(formData.lugarNacimiento),
        lugarDefuncion: toOptional(formData.lugarDefuncion),
        nombreConyuge: toOptional(formData.nombreConyuge),
        nombrePadre: toOptional(formData.nombrePadre),
        nombreMadre: toOptional(formData.nombreMadre),
        numeroCertificadoDefuncion: toOptional(formData.numeroCertificadoDefuncion),
        entidadEmisora: toOptional(formData.entidadEmisora),
        fechaEmisionCertificado: toOptional(formData.fechaEmisionCertificado),
      });
      if (fotoFile && creado?.id) {
        await difuntosApi.uploadFoto(creado.id, fotoFile);
      }
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
          <p className="mt-1 text-sm text-slate-600">
            Registrar un nuevo difunto en una bóveda existente.
          </p>
        </div>
        <Link
          href="/difuntos"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
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
            <h2 className="text-sm font-semibold text-slate-700">Datos personales</h2>
          </header>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <ImageUpload
                shape="circle"
                label="Foto (opcional)"
                hint="JPG, PNG o WEBP, máx. 5 MB"
                onChange={setFotoFile}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Nombres *</label>
              <input
                type="text"
                className={INPUT_CLS}
                required
                value={formData.nombre}
                onChange={(e) => set('nombre', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Apellidos *</label>
              <input
                type="text"
                className={INPUT_CLS}
                required
                value={formData.apellido}
                onChange={(e) => set('apellido', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Identificación</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                className={INPUT_CLS}
                value={formData.numeroIdentificacion}
                onChange={(e) => set('numeroIdentificacion', onlyDigits(e.target.value))}
              />
            </div>
            <div>
              <Select
                label="Género"
                value={formData.genero}
                onChange={(e) => set('genero', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar…' },
                  { value: 'M', label: 'Masculino' },
                  { value: 'F', label: 'Femenino' },
                ]}
              />
            </div>
            <div>
              <Select
                label="Estado civil"
                value={formData.estadoCivil}
                onChange={(e) => set('estadoCivil', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar…' },
                  { value: 'Soltero/a', label: 'Soltero/a' },
                  { value: 'Casado/a', label: 'Casado/a' },
                  { value: 'Divorciado/a', label: 'Divorciado/a' },
                  { value: 'Viudo/a', label: 'Viudo/a' },
                  { value: 'Unión libre', label: 'Unión libre' },
                ]}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Nacionalidad</label>
              <input
                type="text"
                className={INPUT_CLS}
                placeholder="Ecuatoriana"
                value={formData.nacionalidad}
                onChange={(e) => set('nacionalidad', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Fechas y lugares</h2>
          </header>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={LABEL_CLS}>Fecha de nacimiento</label>
              <input
                type="date"
                className={INPUT_CLS}
                value={formData.fechaNacimiento}
                onChange={(e) => set('fechaNacimiento', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha de defunción *</label>
              <input
                type="date"
                className={INPUT_CLS}
                required
                value={formData.fechaDefuncion}
                onChange={(e) => set('fechaDefuncion', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha de inhumación *</label>
              <input
                type="date"
                className={INPUT_CLS}
                required
                value={formData.fechaInhumacion}
                onChange={(e) => set('fechaInhumacion', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Lugar de nacimiento</label>
              <input
                type="text"
                className={INPUT_CLS}
                value={formData.lugarNacimiento}
                onChange={(e) => set('lugarNacimiento', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Lugar de defunción</label>
              <input
                type="text"
                className={INPUT_CLS}
                value={formData.lugarDefuncion}
                onChange={(e) => set('lugarDefuncion', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Causa de muerte</label>
              <input
                type="text"
                className={INPUT_CLS}
                value={formData.causaMuerte}
                onChange={(e) => set('causaMuerte', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Familia</h2>
          </header>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <div>
              <label className={LABEL_CLS}>Padre</label>
              <input
                type="text"
                className={INPUT_CLS}
                value={formData.nombrePadre}
                onChange={(e) => set('nombrePadre', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Madre</label>
              <input
                type="text"
                className={INPUT_CLS}
                value={formData.nombreMadre}
                onChange={(e) => set('nombreMadre', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Cónyuge</label>
              <input
                type="text"
                className={INPUT_CLS}
                value={formData.nombreConyuge}
                onChange={(e) => set('nombreConyuge', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Certificado de defunción
            </h2>
          </header>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <div>
              <label className={LABEL_CLS}>Número</label>
              <input
                type="text"
                className={INPUT_CLS}
                value={formData.numeroCertificadoDefuncion}
                onChange={(e) =>
                  set('numeroCertificadoDefuncion', e.target.value)
                }
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Entidad emisora</label>
              <input
                type="text"
                className={INPUT_CLS}
                value={formData.entidadEmisora}
                onChange={(e) => set('entidadEmisora', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha de emisión</label>
              <input
                type="date"
                className={INPUT_CLS}
                value={formData.fechaEmisionCertificado}
                onChange={(e) => set('fechaEmisionCertificado', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Ubicación y observaciones
            </h2>
          </header>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div>
              <Select
                label="Bóveda"
                required
                value={formData.bovedaId}
                onChange={(e) => set('bovedaId', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar bóveda…' },
                  ...bovedas.map((boveda) => ({
                    value: boveda.id,
                    label: `${boveda.numero} — ${boveda.bloque?.nombre || 'Sin bloque'}`,
                  })),
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>Observaciones</label>
              <textarea
                className={INPUT_CLS}
                rows={3}
                value={formData.observaciones}
                onChange={(e) => set('observaciones', e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <Link
            href="/difuntos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <Button
            type="submit"
            loading={loading}
            leftIcon={<Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
