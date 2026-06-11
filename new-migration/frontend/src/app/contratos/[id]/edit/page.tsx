'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { bovedasApi, contratosApi, difuntosApi } from '@/lib/api';
import { DatePicker } from '@/components/ui';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

const LABEL_CLS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function EditContratoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bovedas, setBovedas] = useState<any[]>([]);
  const [difuntos, setDifuntos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    bovedaId: '',
    difuntoId: '',
    fechaInicio: '',
    fechaFin: '',
    numeroDeMeses: '12',
    montoTotal: '',
    observaciones: '',
    estado: true,
  });

  const loadAllPages = async <T,>(
    loader: (params: { page: number; limit: number }) => Promise<{
      data: T[];
      meta?: { totalPages: number };
    }>,
  ) => {
    const items: T[] = [];
    let page = 1;

    while (true) {
      const result = await loader({ page, limit: 100 });
      items.push(...(result.data || []));
      const totalPages = result.meta?.totalPages ?? 1;
      if (page >= totalPages) break;
      page += 1;
    }

    return items;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [contrato, bovedasData, difuntosData] = await Promise.all([
          contratosApi.findOne(Number(params.id)),
          loadAllPages((params) => bovedasApi.findPage(params)),
          loadAllPages((params) => difuntosApi.findPage(params)),
        ]);

        setBovedas((bovedasData || []).filter((item: any) => item.estado));
        setDifuntos((difuntosData || []).filter((item: any) => item.estado));

        setFormData({
          bovedaId: contrato.bovedaId?.toString() || '',
          difuntoId: contrato.difuntoId?.toString() || '',
          fechaInicio: contrato.fechaInicio
            ? new Date(contrato.fechaInicio).toISOString().split('T')[0]
            : '',
          fechaFin: contrato.fechaFin
            ? new Date(contrato.fechaFin).toISOString().split('T')[0]
            : '',
          numeroDeMeses: contrato.numeroDeMeses?.toString() || '12',
          montoTotal: contrato.montoTotal?.toString() || '',
          observaciones: contrato.observaciones || '',
          estado: !!contrato.estado,
        });
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await contratosApi.update(Number(params.id), {
        bovedaId: Number(formData.bovedaId),
        difuntoId: Number(formData.difuntoId),
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin || null,
        numeroDeMeses: Number(formData.numeroDeMeses),
        montoTotal: Number(formData.montoTotal),
        observaciones: formData.observaciones || null,
        estado: formData.estado,
      });
      router.push(`/contratos/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el contrato');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2
          className="h-6 w-6 animate-spin text-primary-500"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar contrato</h1>
          <p className="mt-1 text-sm text-slate-500">
            Actualizar los datos del contrato de arrendamiento.
          </p>
        </div>
        <Link
          href={`/contratos/${params.id}`}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Volver
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS}>Bóveda *</label>
              <select
                required
                value={formData.bovedaId}
                onChange={(e) =>
                  setFormData({ ...formData, bovedaId: e.target.value })
                }
                className={INPUT_CLS}
              >
                <option value="">Seleccionar…</option>
                {bovedas.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.numero} - {b.bloque?.nombre || 'Sin bloque'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Difunto *</label>
              <select
                required
                value={formData.difuntoId}
                onChange={(e) =>
                  setFormData({ ...formData, difuntoId: e.target.value })
                }
                className={INPUT_CLS}
              >
                <option value="">Seleccionar…</option>
                {difuntos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} {d.apellido}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <DatePicker
              label="Fecha inicio"
              required
              value={formData.fechaInicio}
              onChange={(iso) =>
                setFormData({ ...formData, fechaInicio: iso })
              }
            />
            <DatePicker
              label="Fecha fin"
              value={formData.fechaFin}
              onChange={(iso) => setFormData({ ...formData, fechaFin: iso })}
            />
            <div>
              <label className={LABEL_CLS}>Años *</label>
              <input
                type="number"
                min={1}
                required
                value={formData.numeroDeMeses}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numeroDeMeses: e.target.value,
                  })
                }
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Estado</label>
              <select
                value={formData.estado ? 'true' : 'false'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estado: e.target.value === 'true',
                  })
                }
                className={INPUT_CLS}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Monto total *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.montoTotal}
              onChange={(e) =>
                setFormData({ ...formData, montoTotal: e.target.value })
              }
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Observaciones</label>
            <textarea
              rows={3}
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              className={INPUT_CLS}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Link
              href={`/contratos/${params.id}`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
            >
              <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
