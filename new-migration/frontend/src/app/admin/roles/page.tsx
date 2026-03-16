'use client';

import { FormEvent, useEffect, useState } from 'react';
import { rolesApi } from '@/lib/api';

export default function AdminRolesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ nombre: '', permisos: '' });

  const loadRoles = async () => {
    try {
      const data = await rolesApi.findAll();
      setRoles(data);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await rolesApi.create(formData);
      setFormData({ nombre: '', permisos: '' });
      await loadRoles();
    } catch (err: any) {
      setError(err.message || 'No se pudo crear el rol');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar rol?')) return;
    await rolesApi.delete(id);
    await loadRoles();
  };

  if (loading) return <div className="container">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Gestión de Roles</h2>
        <p className="text-muted mb-0 small">Crear y administrar roles del sistema</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-md-5">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Nuevo Rol</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Permisos (texto)</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={formData.permisos}
                    onChange={(e) => setFormData({ ...formData, permisos: e.target.value })}
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Rol'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Roles Existentes</h5>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Usuarios</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((rol) => (
                    <tr key={rol.id}>
                      <td>{rol.nombre}</td>
                      <td>{rol.usuarios?.length || 0}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(rol.id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
