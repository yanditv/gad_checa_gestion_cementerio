'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { inventarioCustodiosApi } from '@/lib/api';
import { Button, Card, Checkbox, Input } from '@/components/ui';

interface FormState {
  nombre: string;
  identificacion: string;
  cargo: string;
  estado: boolean;
}

function toOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export default function EditCustodioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    identificacion: '',
    cargo: '',
    estado: true,
  });

  useEffect(() => {
    inventarioCustodiosApi
      .findOne(id)
      .then((data) =>
        setFormData({
          nombre: data.nombre ?? '',
          identificacion: data.identificacion ?? '',
          cargo: data.cargo ?? '',
          estado: data.estado ?? true,
        }),
      )
      .catch((err: any) =>
        setError(err.message || 'No se pudo cargar el custodio'),
      )
      .finally(() => setFetching(false));
  }, [id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await inventarioCustodiosApi.update(id, {
        nombre: formData.nombre.trim(),
        identificacion: toOptional(formData.identificacion),
        cargo: toOptional(formData.cargo),
        estado: formData.estado,
      });
      router.push('/inventario/custodios');
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el custodio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar custodio</h1>
          <p className="mt-1 text-sm text-slate-600">
            Actualizar los datos del responsable de bienes.
          </p>
        </div>
        <Link
          href="/inventario/custodios"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
        </Link>
      </div>

      {fetching ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-600 shadow-soft">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary-500" strokeWidth={2} aria-hidden="true" />
            Cargando custodio…
          </div>
        </div>
      ) : (
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
                  value={formData.nombre}
                  onChange={(e) => set('nombre', e.target.value)}
                />
                <Input
                  label="Identificación"
                  value={formData.identificacion}
                  onChange={(e) => set('identificacion', e.target.value)}
                />
                <Input
                  label="Cargo"
                  value={formData.cargo}
                  onChange={(e) => set('cargo', e.target.value)}
                />
                <div className="sm:col-span-2">
                  <Checkbox
                    label="Custodio activo"
                    checked={formData.estado}
                    onChange={(e) => set('estado', e.target.checked)}
                  />
                </div>
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
                Solo el <strong className="text-slate-700">nombre</strong> es
                obligatorio. La identificación y el cargo son opcionales.
              </p>
              <p className="mt-2 text-slate-500">
                Desmarca <strong className="text-slate-700">Custodio activo</strong>{' '}
                para ocultarlo sin eliminarlo.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
