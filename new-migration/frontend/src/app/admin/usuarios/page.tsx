'use client';

import { useEffect, useState } from 'react';
import { rolesApi, usuariosApi } from '@/lib/api';

export default function AdminUsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [usuariosData, rolesData] = await Promise.all([usuariosApi.findAll(), rolesApi.findAll()]);
      setUsuarios(usuariosData);
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la gestión de usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleEstado = async (id: string, estado: boolean) => {
    await usuariosApi.updateEstado(id, !estado);
    await loadData();
  };

  const updateRoles = async (id: string, selected: string[]) => {
    await usuariosApi.setRoles(id, selected);
    await loadData();
  };

  if (loading) return <div className="container">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 600 }}>Gestión de Usuarios</h2>
        <p className="text-muted mb-0 small">Administración básica de usuarios y roles</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                const currentRoles = usuario.usuarioRols?.map((item: any) => item.rolId) || [];

                return (
                  <tr key={usuario.id}>
                    <td>{usuario.nombre} {usuario.apellido}</td>
                    <td>{usuario.email}</td>
                    <td>
                      <select
                        className="form-select"
                        multiple
                        value={currentRoles}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                          updateRoles(usuario.id, values);
                        }}
                        style={{ minWidth: 220 }}
                      >
                        {roles.map((rol) => (
                          <option key={rol.id} value={rol.id}>
                            {rol.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${usuario.estado ? 'badge-success' : 'badge-danger'}`}>
                        {usuario.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => toggleEstado(usuario.id, usuario.estado)}>
                        {usuario.estado ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
