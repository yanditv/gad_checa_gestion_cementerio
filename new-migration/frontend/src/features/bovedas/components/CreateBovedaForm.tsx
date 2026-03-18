'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { createBovedaPayloadSchema, mapCreateBovedaFieldErrors } from '../schemas';
import { createBoveda, getBlockOptions } from '../api';
import { useCreateBovedaFormStore } from '../store/create-boveda-form.store';
import { BOVEDA_TYPES, BOVEDA_TYPE_LABELS, type CreateBovedaFormValues } from '../types';

function InputError({ message }: { message?: string }) {
  if (!message) return null;

  return <div className="text-danger small mt-1">{message}</div>;
}

export function CreateBovedaForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const values = useCreateBovedaFormStore((state) => state.values);
  const setField = useCreateBovedaFormStore((state) => state.setField);
  const reset = useCreateBovedaFormStore((state) => state.reset);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateBovedaFormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: bloques = [], isLoading: bloquesLoading, isError: bloquesError } = useQuery({
    queryKey: ['bovedas', 'blocks'],
    queryFn: getBlockOptions,
    select: (blocks) => blocks.filter((block) => block.isActive),
  });
  const createMutation = useMutation({
    mutationFn: createBoveda,
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({ queryKey: ['bovedas'] });
      router.push('/bovedas');
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setServerError(null);

    const parsed = createBovedaPayloadSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(mapCreateBovedaFieldErrors(parsed.error));
      return;
    }

    try {
      await createMutation.mutateAsync(parsed.data);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No se pudo guardar la bóveda');
    }
  };

  return (
    <div>
      <PageHeader
        title="Nueva Bóveda"
        subtitle="Registrar una nueva bóveda"
        actions={
          <Link href="/bovedas" className="btn btn-secondary">
            <i className="ti ti-arrow-left me-1"></i>
            Volver
          </Link>
        }
      />

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Datos de la Bóveda</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} noValidate>
                {serverError ? <div className="alert alert-danger">{serverError}</div> : null}
                {bloquesError ? (
                  <div className="alert alert-warning">No se pudieron cargar los bloques disponibles.</div>
                ) : null}

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Número de Bóveda *</label>
                      <input
                        type="text"
                        className={`form-control${fieldErrors.numero ? ' is-invalid' : ''}`}
                        placeholder="Ej: B001"
                        value={values.numero}
                        onChange={(event) => setField('numero', event.target.value)}
                      />
                      <InputError message={fieldErrors.numero} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Bloque *</label>
                      <select
                        className={`form-select${fieldErrors.bloqueId ? ' is-invalid' : ''}`}
                        value={values.bloqueId}
                        onChange={(event) => setField('bloqueId', event.target.value)}
                        disabled={bloquesLoading}
                      >
                        <option value="">
                          {bloquesLoading ? 'Cargando bloques...' : 'Seleccionar bloque...'}
                        </option>
                        {bloques.map((bloque) => (
                          <option key={bloque.id} value={bloque.id}>
                            {bloque.name}
                          </option>
                        ))}
                      </select>
                      <InputError message={fieldErrors.bloqueId} />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Tipo *</label>
                      <select
                        className={`form-select${fieldErrors.tipo ? ' is-invalid' : ''}`}
                        value={values.tipo}
                        onChange={(event) => setField('tipo', event.target.value as (typeof BOVEDA_TYPES)[number])}
                      >
                        {BOVEDA_TYPES.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {BOVEDA_TYPE_LABELS[tipo as keyof typeof BOVEDA_TYPE_LABELS] ?? tipo}
                          </option>
                        ))}
                      </select>
                      <InputError message={fieldErrors.tipo} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Capacidad *</label>
                      <input
                        type="number"
                        min="1"
                        className={`form-control${fieldErrors.capacidad ? ' is-invalid' : ''}`}
                        placeholder="Número de cuerpos"
                        value={values.capacidad}
                        onChange={(event) => setField('capacidad', event.target.value)}
                      />
                      <InputError message={fieldErrors.capacidad} />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Precio de Venta</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control${fieldErrors.precio ? ' is-invalid' : ''}`}
                        placeholder="0.00"
                        value={values.precio}
                        onChange={(event) => setField('precio', event.target.value)}
                      />
                      <InputError message={fieldErrors.precio} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Precio de Arrendamiento</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control${fieldErrors.precioArrendamiento ? ' is-invalid' : ''}`}
                        placeholder="0.00"
                        value={values.precioArrendamiento}
                        onChange={(event) => setField('precioArrendamiento', event.target.value)}
                      />
                      <InputError message={fieldErrors.precioArrendamiento} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ubicación</label>
                  <input
                    type="text"
                    className={`form-control${fieldErrors.ubicacion ? ' is-invalid' : ''}`}
                    placeholder="Descripción de la ubicación"
                    value={values.ubicacion}
                    onChange={(event) => setField('ubicacion', event.target.value)}
                  />
                  <InputError message={fieldErrors.ubicacion} />
                </div>

                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className={`form-control${fieldErrors.observaciones ? ' is-invalid' : ''}`}
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    value={values.observaciones}
                    onChange={(event) => setField('observaciones', event.target.value)}
                  ></textarea>
                  <InputError message={fieldErrors.observaciones} />
                </div>

                <div className="form-group">
                  <label className="form-label d-flex align-items-center gap-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={values.estado}
                      onChange={(event) => setField('estado', event.target.checked)}
                    />
                    Bóveda disponible para arrendar
                  </label>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Link href="/bovedas" className="btn btn-secondary">
                    Cancelar
                  </Link>
                  <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <span className="spinner" style={{ width: 16, height: 16 }}></span>
                        {' '}Guardando...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-check me-1"></i>
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Información</h5>
            </div>
            <div className="card-body">
              <p className="text-muted small">
                El formulario conserva el borrador localmente mientras trabaja. Los campos marcados con * son obligatorios.
              </p>
              <hr />
              <p className="text-muted small mb-2">
                <strong>Tipos de espacio:</strong>
              </p>
              <ul className="text-muted small" style={{ paddingLeft: '1rem', marginBottom: 0 }}>
                <li><strong>Bóveda:</strong> Espacio tradicional para entierro.</li>
                <li><strong>Nicho:</strong> Espacio reducido para restos o cenizas.</li>
                <li><strong>Mausoleo:</strong> Construcción privada o familiar.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}