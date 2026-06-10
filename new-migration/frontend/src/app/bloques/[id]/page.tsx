'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { bloquesApi } from '@/lib/api';

interface Piso {
  id: number;
  numero: number;
  descripcion?: string | null;
}

interface Boveda {
  id: number;
  numero: string;
  estado: boolean;
  piso?: Piso | null;
}

interface Bloque {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  cementerio?: { id: number; nombre: string } | null;
  pisos?: Piso[];
  bovedas?: Boveda[];
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
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ${tones[tone]}`}>
        {value}
      </span>
    </div>
  );
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
    const totalBovedas = bloque?.bovedas?.length ?? 0;
    const activas = (bloque?.bovedas ?? []).filter((item) => item.estado).length;
    const inactivas = totalBovedas - activas;
    const pisos = bloque?.pisos?.length ?? 0;
    return { totalBovedas, activas, inactivas, pisos };
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
            <i className="ti ti-arrow-left" /> Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  if (!bloque) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bloque {bloque.nombre}</h1>
          <p className="mt-1 text-sm text-slate-500">Información general del bloque y sus bóvedas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/bloques/${bloque.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-edit" /> Editar
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <i className={`ti ${deleting ? 'ti-loader animate-spin' : 'ti-trash'}`} /> Desactivar
          </button>
          <Link
            href="/bloques"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-arrow-left" /> Volver
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Cementerio" value={bloque.cementerio?.nombre || '-'} tone="primary" />
        <StatCard label="Pisos" value={stats.pisos} tone="success" />
        <StatCard label="Bóvedas registradas" value={stats.totalBovedas} tone="warning" />
        <StatCard label="Bóvedas activas" value={stats.activas} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-1">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Información básica</h2>
          </header>
          <div className="space-y-4 p-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Nombre</p>
              <p className="mt-1 font-medium text-slate-800">{bloque.nombre}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Estado</p>
              <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${bloque.estado ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                {bloque.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Descripción</p>
              <p className="mt-1 text-slate-700">{bloque.descripcion || 'Sin descripción registrada.'}</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Pisos del bloque</h2>
          </header>
          <div className="p-5">
            {stats.pisos === 0 ? (
              <p className="text-sm text-slate-500">Este bloque no tiene pisos autogenerados.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(bloque.pisos ?? []).map((piso) => (
                  <span key={piso.id} className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 ring-1 ring-primary-200">
                    Piso {piso.numero}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Bóvedas del bloque</h2>
          <span className="text-xs font-medium text-slate-500">{stats.totalBovedas} registradas</span>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Piso</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(bloque.bovedas ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-slate-400">No hay bóvedas registradas en este bloque.</td>
                </tr>
              ) : (
                (bloque.bovedas ?? []).map((boveda) => (
                  <tr key={boveda.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{boveda.numero}</td>
                    <td className="px-4 py-3 text-slate-600">{boveda.piso?.numero ? `Piso ${boveda.piso.numero}` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${boveda.estado ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                        {boveda.estado ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
