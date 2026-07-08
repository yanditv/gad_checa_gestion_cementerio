'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { inventarioCategoriasApi } from '@/lib/api';
import { Button, Checkbox, Input, Modal } from '@/components/ui';

interface FormState {
  nombre: string;
  vidaUtilAnios: string;
  valorResidualPct: string;
  estado: boolean;
}

interface CategoriaFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (data?: any) => void;
  categoria?: {
    id: number;
    nombre: string;
    vidaUtilAnios: number;
    valorResidualPct: number;
    estado: boolean;
  } | null;
}

export function CategoriaFormModal({ open, onClose, onSaved, categoria }: CategoriaFormModalProps) {
  const isEdit = !!categoria;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!categoria && open);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    vidaUtilAnios: '',
    valorResidualPct: '10',
    estado: true,
  });

  useEffect(() => {
    if (open && categoria) {
      setFetching(true);
      inventarioCategoriasApi
        .findOne(categoria.id)
        .then((data) =>
          setFormData({
            nombre: data.nombre ?? '',
            vidaUtilAnios: String(data.vidaUtilAnios ?? ''),
            valorResidualPct: String(data.valorResidualPct ?? ''),
            estado: data.estado ?? true,
          }),
        )
        .catch((err: any) =>
          setError(err.message || 'No se pudo cargar la categoría'),
        )
        .finally(() => setFetching(false));
    } else if (open && !categoria) {
      setFormData({ nombre: '', vidaUtilAnios: '', valorResidualPct: '10', estado: true });
      setError('');
    }
  }, [open, categoria]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let result: any;
      if (isEdit) {
        result = await inventarioCategoriasApi.update(categoria!.id, {
          nombre: formData.nombre.trim(),
          vidaUtilAnios: Number(formData.vidaUtilAnios),
          valorResidualPct:
            formData.valorResidualPct.trim() === ''
              ? undefined
              : Number(formData.valorResidualPct),
          estado: formData.estado,
        });
      } else {
        result = await inventarioCategoriasApi.create({
          nombre: formData.nombre.trim(),
          vidaUtilAnios: Number(formData.vidaUtilAnios),
          valorResidualPct:
            formData.valorResidualPct.trim() === ''
              ? undefined
              : Number(formData.valorResidualPct),
        });
      }
      onSaved(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
      description={
        isEdit
          ? 'Actualizar vida útil y valor residual.'
          : 'Registrar una categoría de bienes para la depreciación.'
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="categoria-form"
            loading={loading}
            leftIcon={<Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      {fetching ? (
        <div className="py-6 text-center text-sm text-slate-500">Cargando categoría…</div>
      ) : (
        <form id="categoria-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-danger-200">
              {error}
            </div>
          )}

          <Input
            label="Nombre"
            required
            placeholder="Equipo de cómputo"
            value={formData.nombre}
            onChange={(e) => set('nombre', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
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

          {isEdit && (
            <Checkbox
              label="Categoría activa"
              checked={formData.estado}
              onChange={(e) => set('estado', e.target.checked)}
            />
          )}
        </form>
      )}
    </Modal>
  );
}
