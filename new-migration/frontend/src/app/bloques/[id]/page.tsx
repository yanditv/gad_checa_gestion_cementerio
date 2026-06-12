'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Package, Pencil, Trash2 } from 'lucide-react';
import { bloquesApi } from '@/lib/api';
import {
  DataTable,
  EmptyState,
  type DataTableColumn,
} from '@/components/ui';

interface Piso {
  id: number;
  numero: number;
  descripcion?: string | null;
  precio?: number | null;
  bovedas?: Boveda[];
}

interface Boveda {
  id: number;
  numero: string;
  tipo?: string | null;
  estado: boolean;
  piso?: Piso | null;
  propietario?: { id: number; persona: { nombre: string; apellido: string } } | null;
  contratos?: { id: number; fechaInicio: string; fechaFin: string | null; difunto?: { nombre: string; apellido: string } | null }[];
  difuntos?: { id: number; nombre: string; apellido: string; fechaDefuncion: string | null }[];
}

interface Bloque {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string | null;
  tarifaBase: number | null;
  bovedasPorPiso: number;
  estado: boolean;
  cementerio?: { id: number; nombre: string } | null;
  pisos?: Piso[];
  bovedas?: Boveda[];
}

function formatCurrency(value: number | string | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: 'primary' | 'success' | 'warning' | 'danger'; }) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700 ring-primary-200',
    success: 'bg-green-50 text-green-700 ring-green-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
    danger: 'bg-red-50 text-red-700 ring-red-200',
  } as const;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ${tones[tone]}`}>
        {value}
      </span>
    </div>
  );
}

// Determinar estado visual de una bóveda
function getEstadoBoveda(b: Boveda): { label: string; color: string; bg: string } {
  const tienePropietario = !!b.propietario;
  const tieneContratoActivo = (b.contratos ?? []).length > 0;

  // "por-liberar": contrato activo que vence en ≤ 3 meses
  const contrato = (b.contratos ?? []).find(() => true);
  const fechaFin = contrato?.fechaFin ? new Date(contrato.fechaFin) : null;
  const dentroDe3Meses = fechaFin && (fechaFin.getTime() - Date.now()) < 90 * 24 * 60 * 60 * 1000 && fechaFin > new Date();

  if (tieneContratoActivo && dentroDe3Meses) {
    return { label: 'Por liberar', color: 'bg-yellow-400', bg: 'bg-yellow-50 ring-yellow-200 text-yellow-700' };
  }
  if (tieneContratoActivo) {
    return { label: 'Ocupada', color: 'bg-red-500', bg: 'bg-red-50 ring-red-200 text-red-700' };
  }
  if (tienePropietario) {
    return { label: 'Con propietario', color: 'bg-slate-500', bg: 'bg-slate-100 ring-slate-200 text-slate-600' };
  }
  return { label: 'Disponible', color: 'bg-green-500', bg: 'bg-green-50 ring-green-200 text-green-700' };
}

export default function BloqueDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [bloque, setBloque] = useState<Bloque | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [bloqueId, setBloqueId] = useState<number | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const id = Number(params.id);
      if (!Number.isFinite(id)) {
        if (active) {
          setNotFoundState(true);
          setLoading(false);
        }
        return;
      }

      setBloqueId(id);
      setLoading(true);
      setError('');
      try {
        const data = await bloquesApi.findOne(id);
        if (active) setBloque(data);
      } catch (err: any) {
        if (err.message?.includes('404') || err.message?.includes('no encontrado')) {
          if (active) setNotFoundState(true);
          return;
        }
        if (active) setError(err.message || 'No se pudo cargar el bloque');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [params.id]);

  const stats = useMemo(() => {
    const total = bloque?.bovedas?.length ?? 0;
    const disponibles = (bloque?.bovedas ?? []).filter((b) => {
      const e = getEstadoBoveda(b);
      return e.label === 'Disponible';
    }).length;
    const ocupadas = (bloque?.bovedas ?? []).filter((b) => {
      const e = getEstadoBoveda(b);
      return e.label === 'Ocupada' || e.label === 'Por liberar';
    }).length;
    return {
      totalBovedas: total,
      activas: (bloque?.bovedas ?? []).filter((b) => b.estado).length,
      disponibles,
      ocupadas,
      pisos: bloque?.pisos?.length ?? 0,
    };
  }, [bloque]);

  const bovedasPorPiso = useMemo(() => {
    const map: { [pisoNum: number]: Boveda[] } = {};
    for (const b of bloque?.bovedas ?? []) {
      const pisoNum = b.piso?.numero ?? 0;
      if (!map[pisoNum]) map[pisoNum] = [];
      map[pisoNum].push(b);
    }
    return map;
  }, [bloque]);

  // Todos los difuntos del bloque
  const difuntos = useMemo(() => {
    const all: { id: number; nombre: string; apellido: string; fechaDefuncion: string | null; piso: number; boveda: string }[] = [];
    for (const b of bloque?.bovedas ?? []) {
      for (const d of b.difuntos ?? []) {
        all.push({ ...d, piso: b.piso?.numero ?? 0, boveda: b.numero });
      }
    }
    return all;
  }, [bloque]);

  const handleDelete = async () => {
    if (!bloqueId || !window.confirm('¿Desactivar este bloque?')) return;
    setDeleting(true);
    setError('');
    try {
      await bloquesApi.delete(bloqueId);
      router.push('/bloques');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'No se pudo desactivar el bloque');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-soft">Cargando bloque…</div>;
  }

  if (notFoundState) {
    return (
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-xl font-semibold text-slate-900">Bloque no encontrado</h1>
        <p className="text-sm text-slate-600">El bloque solicitado no existe o ya no está disponible.</p>
        <div>
          <Link href="/bloques" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  if (!bloque) return null;

  const pisosColumns: DataTableColumn<Piso>[] = [
    {
      key: 'piso',
      header: 'Piso',
      sortable: true,
      sortValue: (piso) => piso.numero,
      cell: (piso) => <span className="font-medium">Piso {piso.numero}</span>,
    },
    {
      key: 'precio',
      header: 'Precio',
      sortable: true,
      sortValue: (piso) => Number(piso.precio ?? bloque.tarifaBase ?? 0),
      cell: (piso) => formatCurrency(piso.precio ?? bloque.tarifaBase),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      cell: (piso) => {
        const esTarifaBase = piso.precio == null || Number(piso.precio) === Number(bloque.tarifaBase);
        return (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${esTarifaBase ? 'bg-info-50 text-info-700 ring-info-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
            {esTarifaBase ? 'Tarifa base' : 'Personalizado'}
          </span>
        );
      },
    },
  ];

  const difuntosColumns: DataTableColumn<(typeof difuntos)[number]>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      sortValue: (d) => `${d.nombre} ${d.apellido}`,
      cell: (d) => (
        <span className="font-medium text-slate-800">{d.nombre} {d.apellido}</span>
      ),
    },
    {
      key: 'fechaDefuncion',
      header: 'F. defunción',
      sortable: true,
      sortValue: (d) => (d.fechaDefuncion ? new Date(d.fechaDefuncion) : null),
      cell: (d) => (
        <span className="text-slate-600">
          {d.fechaDefuncion ? new Date(d.fechaDefuncion).toLocaleDateString('es-EC') : '—'}
        </span>
      ),
    },
    {
      key: 'ubicacion',
      header: 'Ubicación',
      sortable: true,
      sortValue: (d) => d.piso,
      cell: (d) => (
        <span className="text-slate-600">Piso {d.piso} · Bóveda {d.boveda}</span>
      ),
    },
  ];

  const bovedasColumns: DataTableColumn<Boveda>[] = [
    {
      key: 'numero',
      header: 'Número',
      sortable: true,
      sortValue: (b) => b.numero,
      cell: (b) => <span className="font-medium text-slate-800">{b.numero}</span>,
    },
    {
      key: 'piso',
      header: 'Piso',
      sortable: true,
      sortValue: (b) => b.piso?.numero ?? null,
      cell: (b) => (
        <span className="text-slate-600">{b.piso?.numero ? `Piso ${b.piso.numero}` : '-'}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      sortValue: (b) => getEstadoBoveda(b).label,
      cell: (b) => {
        const estado = getEstadoBoveda(b);
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${estado.bg}`}>
            {estado.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bloque {bloque.nombre}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {bloque.tipo === 'Nichos' ? 'Nichos' : 'Bóvedas'}
            {bloque.cementerio?.nombre ? ` · ${bloque.cementerio.nombre}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/bloques/${bloque.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Editar
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            )}{' '}
            Desactivar
          </button>
          <Link
            href="/bloques"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Volver
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Cementerio" value={bloque.cementerio?.nombre || '-'} tone="primary" />
        <StatCard label="Pisos" value={stats.pisos} tone="success" />
        <StatCard label="Bóvedas total" value={stats.totalBovedas} tone="warning" />
        <StatCard label="Ocupación" value={`${stats.ocupadas}/${stats.totalBovedas}`} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Info básica */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-1">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Información</h2>
          </header>
          <div className="space-y-4 p-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">Nombre</p>
              <p className="mt-1 font-medium text-slate-800">{bloque.nombre}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">Tipo</p>
              <p className="mt-1 font-medium text-slate-800">{bloque.tipo || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">Tarifa base</p>
              <p className="mt-1 font-medium text-slate-800">{formatCurrency(bloque.tarifaBase)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">Estado</p>
              <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${bloque.estado ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                {bloque.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">Descripción</p>
              <p className="mt-1 text-slate-700">{bloque.descripcion || '—'}</p>
            </div>
          </div>
        </section>

        {/* Precios por piso */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Precios por piso</h2>
          </header>
          <DataTable
            columns={pisosColumns}
            rows={bloque.pisos ?? []}
            rowKey={(piso) => piso.id}
            empty={<EmptyState title="No hay pisos registrados." compact />}
          />
        </section>
      </div>

      {/* Vista gráfica de bóvedas */}
      {stats.pisos > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Vista gráfica de bóvedas</h2>
          </header>
          <div className="p-5">
            {/* Leyenda */}
            <div className="mb-4 flex flex-wrap gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-green-500" /> Disponible
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500" /> Ocupada
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-slate-500" /> Con propietario
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-yellow-400" /> Por liberar
              </span>
            </div>

            {/* Pisos descendentes */}
            <div className="space-y-4">
              {[...(bloque.pisos ?? [])].reverse().map((piso) => {
                const bovedas = bovedasPorPiso[piso.numero] ?? [];
                return (
                  <div key={piso.id}>
                    <p className="mb-2 text-sm font-semibold text-slate-700">Piso {piso.numero}</p>
                    <div className="flex flex-wrap gap-2">
                      {bovedas.length === 0 ? (
                        <p className="text-xs text-slate-600">Sin bóvedas</p>
                      ) : (
                        bovedas.map((b) => {
                          const estado = getEstadoBoveda(b);
                          return (
                            <div
                              key={b.id}
                              className="relative flex h-20 w-20 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
                              title={`Bóveda ${b.numero} — ${estado.label}`}
                            >
                              <Package
                                className={`h-5 w-5 ${estado.color.replace('bg-', 'text-')}`}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                              <span className="mt-0.5 text-xs font-medium text-slate-700">{b.numero}</span>
                              {b.propietario && (
                                <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-slate-500" title="Con propietario" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Difuntos del bloque */}
      {difuntos.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Difuntos en el bloque</h2>
            <span className="text-xs font-medium text-slate-500">{difuntos.length} registro(s)</span>
          </header>
          <DataTable
            columns={difuntosColumns}
            rows={difuntos}
            rowKey={(d, i) => `${d.id}-${i}`}
          />
        </section>
      )}

      {/* Tabla de bóvedas (original) */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Bóvedas del bloque</h2>
          <span className="text-xs font-medium text-slate-500">{stats.totalBovedas} registradas</span>
        </header>
        <DataTable
          columns={bovedasColumns}
          rows={bloque.bovedas ?? []}
          rowKey={(boveda) => boveda.id}
          empty={
            <EmptyState title="No hay bóvedas registradas en este bloque." compact />
          }
        />
      </section>
    </div>
  );
}
