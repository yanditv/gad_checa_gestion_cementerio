'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function CuentaPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await authApi.getProfile();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'No hay sesión activa');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) return <div className="container">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Mi Cuenta</h2>
        <p className="text-muted mb-0 small">Información del usuario autenticado</p>
      </div>

      <div className="card">
        <div className="card-body">
          {error && (
            <div className="alert alert-warning">
              {error}. Primero inicia sesión para consultar el perfil.
            </div>
          )}

          {profile && (
            <div className="row">
              <div className="col-md-6">
                <p><strong>Nombres:</strong> {profile.nombre}</p>
                <p><strong>Apellidos:</strong> {profile.apellido}</p>
                <p><strong>Email:</strong> {profile.email}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Identificación:</strong> {profile.tipoIdentificacion} {profile.numeroIdentificacion}</p>
                <p><strong>Teléfono:</strong> {profile.telefono || '-'}</p>
                <p><strong>Dirección:</strong> {profile.direccion || '-'}</p>
              </div>
            </div>
          )}

          {!profile && (
            <Link href="/" className="btn btn-primary">
              Ir al Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
