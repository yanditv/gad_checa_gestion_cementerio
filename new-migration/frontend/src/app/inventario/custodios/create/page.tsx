'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { inventarioCustodiosApi } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';

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
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card padding="none" header="Datos del custodio" className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && (
              <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-danger-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                wrapperClassName="sm:col-span-2"
                label="Nombre"
                required
                placeholder="Juan Pérez"
                value={formData.nombre}
                onChange={(e) => set('nombre', e.target.value)}
              />
              <Input
                label="Identificación"
                placeholder="0102030405"
                value={formData.identificacion}
                onChange={(e) => set('identificacion', e.target.value)}
              />
              <Input
                label="Cargo"
                placeholder="Secretario"
                value={formData.cargo}
                onChange={(e) => set('cargo', e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Link
                href="/inventario/custodios"
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
        </Card>

        <Card padding="none" header="Información">
          <div className="p-5 text-sm text-slate-600">
            <p className="text-slate-500">
              El custodio es el responsable de los bienes asignados:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              <li>
                <strong className="text-slate-700">Nombre:</strong> obligatorio.
              </li>
              <li>
                <strong className="text-slate-700">Identificación y cargo:</strong>{' '}
                opcionales, ayudan a ubicar al responsable.
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
