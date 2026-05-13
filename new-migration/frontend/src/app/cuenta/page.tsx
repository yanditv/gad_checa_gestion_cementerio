'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

interface Profile {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  direccion?: string | null;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  mustChangePassword?: boolean;
  roles?: string[];
}

export default function CuentaPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario de cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((res) => res.json().then((payload) => ({ ok: res.ok, payload })))
      .then(({ ok, payload }) => {
        if (cancelled) return;
        if (!ok) {
          setError(payload?.message || 'No se pudo obtener el perfil');
          return;
        }
        setProfile((payload?.data ?? null) as Profile | null);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo contactar al servidor');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword !== confirm) {
      setPwError('Las contraseñas no coinciden');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          payload.message || 'No se pudo actualizar la contraseña',
        );
      }
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Error');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '40vh' }}
      >
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Mi cuenta"
        subtitle="Información personal y seguridad"
      />

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-lg-7 mb-3">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Datos personales</h5>
            </div>
            <div className="card-body">
              {profile ? (
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <small className="text-muted d-block">Nombres</small>
                    <div>{profile.nombre}</div>
                  </div>
                  <div className="col-md-6 mb-2">
                    <small className="text-muted d-block">Apellidos</small>
                    <div>{profile.apellido}</div>
                  </div>
                  <div className="col-md-6 mb-2">
                    <small className="text-muted d-block">Correo</small>
                    <div>{profile.email}</div>
                  </div>
                  <div className="col-md-6 mb-2">
                    <small className="text-muted d-block">Identificación</small>
                    <div>
                      {profile.tipoIdentificacion} {profile.numeroIdentificacion}
                    </div>
                  </div>
                  <div className="col-md-6 mb-2">
                    <small className="text-muted d-block">Teléfono</small>
                    <div>{profile.telefono || '-'}</div>
                  </div>
                  <div className="col-md-6 mb-2">
                    <small className="text-muted d-block">Dirección</small>
                    <div>{profile.direccion || '-'}</div>
                  </div>
                  {profile.roles && profile.roles.length > 0 && (
                    <div className="col-12 mt-2">
                      <small className="text-muted d-block">Roles</small>
                      <div>
                        {profile.roles.map((r) => (
                          <span
                            key={r}
                            className="badge bg-primary-subtle text-primary me-1"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted mb-0">
                  No se encontró información del usuario.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5 mb-3">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Cambiar contraseña</h5>
            </div>
            <div className="card-body">
              {profile?.mustChangePassword && (
                <div className="alert alert-warning border-0 py-2 mb-3">
                  Debes definir una nueva contraseña antes de continuar usando
                  el sistema.
                </div>
              )}

              <form onSubmit={handleChangePassword} noValidate>
                {pwError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="alert alert-success py-2" role="alert">
                    Contraseña actualizada correctamente.
                  </div>
                )}

                <div className="form-group mb-3">
                  <label className="form-label">Contraseña actual</label>
                  <input
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Nueva contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <small className="text-muted">
                    Mínimo 6 caracteres, con mayúscula, minúscula y un dígito.
                  </small>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    pwLoading || !currentPassword || !newPassword || !confirm
                  }
                >
                  {pwLoading ? 'Guardando…' : 'Actualizar contraseña'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
