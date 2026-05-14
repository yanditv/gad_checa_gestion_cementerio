'use client';

import Link from 'next/link';
import { use } from 'react';

export default function PersonaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const persona = {
    id: id,
    nombre: 'Juan',
    apellido: 'Pérez',
    numeroIdentificacion: '1234567890',
    tipoIdentificacion: 'CED',
    email: 'juan.perez@email.com',
    telefono: '0999999999',
    direccion: 'Calle Principal, Ciudad',
    tipoPersona: 'Propietario',
    estado: true,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {persona.nombre} {persona.apellido}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Detalles de la persona.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/personas/${persona.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-edit" /> Editar
          </Link>
          <Link
            href="/personas"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <i className="ti ti-arrow-left" /> Volver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Información Personal</h2>
            </header>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Tipo de Identificación
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {persona.tipoIdentificacion}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Número de Identificación
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {persona.numeroIdentificacion}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {persona.email || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Teléfono</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {persona.telefono || '-'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Dirección</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {persona.direccion || '-'}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Tipo</h2>
            </header>
            <div className="p-5">
              <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
                {persona.tipoPersona}
              </span>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Acciones</h2>
            </header>
            <div className="flex flex-col gap-2 p-5">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <i className="ti ti-user" /> Ver como Propietario
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <i className="ti ti-trash" /> Eliminar
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
