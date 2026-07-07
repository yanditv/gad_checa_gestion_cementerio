'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { inventarioCustodiosApi } from '@/lib/api';
import { Button, Checkbox, Input, Modal } from '@/components/ui';

interface FormState {
  nombre: string;
  identificacion: string;
  cargo: string;
  estado: boolean;
}

interface CustodioFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (data?: any) => void;
  custodio?: {
    id: number;
    nombre: string;
    identificacion: string | null;
    cargo: string | null;
    estado: boolean;
  } | null;
}

function toOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function CustodioFormModal({ open, onClose, onSaved, custodio }: CustodioFormModalProps) {
  const isEdit = !!custodio;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!custodio && open);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    identificacion: '',
    cargo: '',
    estado: true,
  });

  useEffect(() => {
    if (open && custodio) {
      setFetching(true);
      inventarioCustodiosApi
        .findOne(custodio.id)
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
    } else if (open && !custodio) {
      setFormData({ nombre: '', identificacion: '', cargo: '', estado: true });
      setError('');
    }
  }, [open, custodio]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let result: any;
      if (isEdit) {
        result = await inventarioCustodiosApi.update(custodio!.id, {
          nombre: formData.nombre.trim(),
          identificacion: toOptional(formData.identificacion),
          cargo: toOptional(formData.cargo),
          estado: formData.estado,
        });
      } else {
        result = await inventarioCustodiosApi.create({
          nombre: formData.nombre.trim(),
          identificacion: toOptional(formData.identificacion),
          cargo: toOptional(formData.cargo),
        });
      }
      onSaved(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el custodio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar custodio' : 'Nuevo custodio'}
      description={
        isEdit
          ? 'Actualizar los datos del responsable de bienes.'
          : 'Registrar un responsable de bienes del inventario.'
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="custodio-form"
            loading={loading}
            leftIcon={<Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      {fetching ? (
        <div className="py-6 text-center text-sm text-slate-500">Cargando custodio…</div>
      ) : (
        <form id="custodio-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-danger-200">
              {error}
            </div>
          )}

          <Input
            label="Nombre"
            required
            placeholder="Juan Pérez"
            value={formData.nombre}
            onChange={(e) => set('nombre', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
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

          {isEdit && (
            <Checkbox
              label="Custodio activo"
              checked={formData.estado}
              onChange={(e) => set('estado', e.target.checked)}
            />
          )}
        </form>
      )}
    </Modal>
  );
}
