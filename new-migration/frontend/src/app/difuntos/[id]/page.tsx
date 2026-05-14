'use client';

import Link from 'next/link';
import { use } from 'react';

export default function DifuntoDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const difunto = {
    id: id,
    nombre: 'Juan',
    apellido: 'Pérez',
    numeroIdentificacion: '1234567890',
    fechaNacimiento: '1950-05-15',
    fechaDefuncion: '2024-01-10',
    fechaInhumacion: '2024-01-12',
    causaMuerte: 'Causa Natural',
    edad: 73,
    genero: 'Masculino',
    estado: true,
    boveda: { numero: 'B001', bloque: { nombre: 'Bloque A' } },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {difunto.nombre} {difunto.apellido}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Detalles del difunto.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/difuntos/${difunto.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <i className="ti ti-edit" /> Editar
          </Link>
          <Link
            href="/difuntos"
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
                <p className="text-xs uppercase tracking-wide text-slate-400">Identificación</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {difunto.numeroIdentificacion || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Edad</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{difunto.edad} años</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Género</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{difunto.genero}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Causa de Muerte</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{difunto.causaMuerte}</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Fechas</h2>
            </header>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Fecha de Nacimiento
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {difunto.fechaNacimiento || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Fecha de Defunción
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {difunto.fechaDefuncion}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Fecha de Inhumación
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {difunto.fechaInhumacion}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Ubicación</h2>
            </header>
            <div className="space-y-3 p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Bóveda</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {difunto.boveda.numero}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Bloque</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {difunto.boveda.bloque.nombre}
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Acciones</h2>
            </header>
            <div className="p-5">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
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
