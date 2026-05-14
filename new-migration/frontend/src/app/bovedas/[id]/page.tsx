'use client';

import Link from 'next/link';
import { use } from 'react';

export default function BovedaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const boveda = {
    id: id,
    numero: 'B001',
    tipo: 'Bóveda',
    capacidad: 4,
    estado: true,
    precio: 2500,
    precioArrendamiento: 800,
    ubicacion: 'Primera fila, lado izquierdo',
    observaciones: 'Bóveda en buen estado',
    bloque: { nombre: 'Bloque A', cementerio: { nombre: 'Cementerio Central' } },
    propietario: null,
    difuntos: [{ id: 1, nombre: 'Pedro Gómez', fechaDefuncion: '2024-01-10' }],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bóveda {boveda.numero}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {boveda.bloque.nombre} – {boveda.bloque.cementerio.nombre}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/bovedas/${boveda.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-edit" /> Editar
          </Link>
          <Link
            href="/bovedas"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-arrow-left" /> Volver
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <i className="ti ti-circle-check text-xl" />
        <div>
          Bóveda <strong>disponible</strong> para arrendar
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Información de la Bóveda</h2>
            </header>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Número</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{boveda.numero}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Tipo</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{boveda.tipo}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Capacidad</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {boveda.capacidad} personas
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Estado</p>
                <p className="mt-0.5">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                    Disponible
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Precio de Venta</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  ${boveda.precio.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Precio de Arrendamiento
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  ${boveda.precioArrendamiento.toFixed(2)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Ubicación</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {boveda.ubicacion || '-'}
                </p>
              </div>
              {boveda.observaciones && (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Observaciones</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700">
                    {boveda.observaciones}
                  </p>
                </div>
              )}
            </div>
          </section>

          {boveda.propietario !== null && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <header className="border-b border-slate-100 px-5 py-3">
                <h2 className="text-sm font-semibold text-slate-700">Propietario</h2>
              </header>
              <div className="p-5">
                <p className="text-sm font-medium text-slate-700">
                  {(boveda.propietario as any)?.persona?.nombre}{' '}
                  {(boveda.propietario as any)?.persona?.apellido}
                </p>
              </div>
            </section>
          )}

          {boveda.difuntos.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <header className="border-b border-slate-100 px-5 py-3">
                <h2 className="text-sm font-semibold text-slate-700">Difuntos Enterrados</h2>
              </header>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-2.5">Nombre</th>
                      <th className="px-5 py-2.5">Fecha de Defunción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {boveda.difuntos.map((difunto) => (
                      <tr key={difunto.id}>
                        <td className="px-5 py-2.5 font-medium text-slate-700">
                          {difunto.nombre}
                        </td>
                        <td className="px-5 py-2.5 text-slate-600">
                          {difunto.fechaDefuncion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Acciones Rápidas</h2>
            </header>
            <div className="flex flex-col gap-2 p-5">
              <Link
                href={`/contratos/create?boveda=${boveda.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600"
              >
                <i className="ti ti-file-plus" /> Crear Contrato
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <i className="ti ti-user" /> Asignar Propietario
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <i className="ti ti-trash" /> Eliminar Bóveda
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Bloque</h2>
            </header>
            <div className="p-5">
              <p className="text-sm font-medium text-slate-700">{boveda.bloque.nombre}</p>
              <p className="mt-0.5 text-xs text-slate-500">{boveda.bloque.cementerio.nombre}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
