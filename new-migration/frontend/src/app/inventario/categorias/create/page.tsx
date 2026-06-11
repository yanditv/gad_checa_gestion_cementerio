'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { inventarioCategoriasApi } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';

interface FormState {
  nombre: string;
  vidaUtilAnios: string;
  valorResidualPct: string;
}

const INITIAL: FormState = {
  nombre: '',
  vidaUtilAnios: '',
  valorResidualPct: '10',
};

export default function CreateCategoriaPage() {
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
      await inventarioCategoriasApi.create({
        nombre: formData.nombre.trim(),
        vidaUtilAnios: Number(formData.vidaUtilAnios),
        valorResidualPct:
          formData.valorResidualPct.trim() === ''
            ? undefined
            : Number(formData.valorResidualPct),
      });
      router.push('/inventario/categorias');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva categoría</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registrar una categoría de bienes para la depreciación.
          </p>
        </div>
        <Link
          href="/inventario/categorias"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card padding="none" header="Datos de la categoría" className="lg:col-span-2">
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
                placeholder="Equipo de cómputo"
                value={formData.nombre}
                onChange={(e) => set('nombre', e.target.value)}
              />
              <Input
                label="Vida útil (años)"
                required
                type="number"
                min={1}
                step={1}
                value={formData.vidaUtilAnios}
                onChange={(e) => set('vidaUtilAnios', e.target.value)}
              />
              <Input
                label="Valor residual (%)"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="10"
                value={formData.valorResidualPct}
                onChange={(e) => set('valorResidualPct', e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Link
                href="/inventario/categorias"
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
              La categoría define los parámetros de depreciación de los bienes:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              <li>
                <strong className="text-slate-700">Vida útil:</strong> años de
                depreciación (tabla CGE 406-03).
              </li>
              <li>
                <strong className="text-slate-700">Valor residual:</strong>{' '}
                porcentaje que conserva el bien al final de su vida útil (por
                defecto 10%).
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
