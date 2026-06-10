const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

class ApiClient {
  private token: string | null = null;

  private buildUrl(endpoint: string): string {
    return this.isBrowser() ? `/api${endpoint}` : `${API_URL}${endpoint}`;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(this.buildUrl(endpoint), {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `Error ${response.status}`);
    }

    const payload = await response.json();
    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload.data as T;
    }

    return payload as T;
  }

  private async requestRaw<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(this.buildUrl(endpoint), {
      ...options,
      headers,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.error?.message || payload?.message || `Error ${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  }

  private toQueryString(params?: PaginationParams): string {
    if (!params) return '';
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    });
    const result = query.toString();
    return result ? `?${result}` : '';
  }

  isBrowser() {
    return typeof window !== 'undefined';
  }

  async requestRelative<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `Error ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getPaginatedRelative<T>(endpoint: string, params?: PaginationParams): Promise<PaginatedResponse<T>> {
    return this.requestRelative<PaginatedResponse<T>>(`${endpoint}${this.toQueryString(params)}`, {
      method: 'GET',
      cache: 'no-store',
    });
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async getPaginated<T>(endpoint: string, params?: PaginationParams): Promise<PaginatedResponse<T>> {
    const payload = await this.requestRaw<any>(`${endpoint}${this.toQueryString(params)}`, {
      method: 'GET',
    });

    if (payload && typeof payload === 'object' && 'success' in payload) {
      return {
        data: payload.data ?? [],
        meta: payload.meta ?? {
          page: params?.page || 1,
          limit: params?.limit || 20,
          total: Array.isArray(payload.data) ? payload.data.length : 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    return payload as PaginatedResponse<T>;
  }
}

export const api = new ApiClient();

export const authApi = {
  login: (email: string, password: string) => 
    api.post<{ user: any; token: string }>('/auth/login', { email, password }),
  register: (data: any) => 
    api.post<{ user: any; token: string }>('/auth/register', data),
  getProfile: () => api.get<any>('/auth/profile'),
};

export const contratosApi = {
  findAll: () => api.get<any[]>('/contratos'),
  findPage: (params?: PaginationParams) => api.getPaginated<any>('/contratos', params),
  getCreateMetadata: () =>
    api['isBrowser']()
      ? api['requestRelative']<any>('/api/contratos/create-metadata', { method: 'GET', cache: 'no-store' })
      : api.get<any>('/contratos/create-metadata'),
  getNumeroSecuencial: (bovedaId?: number, isRenovacion?: boolean) =>
    api['isBrowser']()
      ? api['requestRelative']<any>(
          `/api/contratos/numero-secuencial${bovedaId ? `?bovedaId=${bovedaId}&isRenovacion=${Boolean(isRenovacion)}` : ''}`,
          { method: 'GET', cache: 'no-store' },
        )
      : api.get<any>(`/contratos/numero-secuencial${bovedaId ? `?bovedaId=${bovedaId}&isRenovacion=${Boolean(isRenovacion)}` : ''}`),
  getBovedasDisponibles: (params?: PaginationParams) =>
    api['isBrowser']()
      ? api['getPaginatedRelative']<any>('/api/contratos/bovedas-disponibles', params)
      : api.getPaginated<any>('/contratos/bovedas-disponibles', params),
  findOne: (id: number) => api.get<any>(`/contratos/${id}`),
  create: (data: any) =>
    api['isBrowser']()
      ? api['requestRelative']<any>('/api/contratos', {
          method: 'POST',
          body: JSON.stringify(data),
        })
      : api.post<any>('/contratos', data),
  update: (id: number, data: any) => api.put<any>(`/contratos/${id}`, data),
  delete: (id: number) => api.delete<any>(`/contratos/${id}`),
  getReportes: () => api.get<any>('/contratos/reportes'),
};

export const bovedasApi = {
  findAll: () => api.get<any[]>('/bovedas'),
  findPage: (params?: PaginationParams) => api.getPaginated<any>('/bovedas', params),
  findOne: (id: number) => api.get<any>(`/bovedas/${id}`),
  create: (data: any) => api.post<any>('/bovedas', data),
  update: (id: number, data: any) => api.put<any>(`/bovedas/${id}`, data),
  delete: (id: number) => api.delete<any>(`/bovedas/${id}`),
};

export const difuntosApi = {
  findAll: () => api.get<any[]>('/difuntos'),
  findPage: (params?: PaginationParams) => api.getPaginated<any>('/difuntos', params),
  findOne: (id: number) => api.get<any>(`/difuntos/${id}`),
  create: (data: any) => api.post<any>('/difuntos', data),
  update: (id: number, data: any) => api.put<any>(`/difuntos/${id}`, data),
  delete: (id: number) => api.delete<any>(`/difuntos/${id}`),
};

export const personasApi = {
  findAll: (tipo?: string) => api.get<any[]>(`/personas${tipo ? `?tipo=${tipo}` : ''}`),
  findPage: (params?: PaginationParams) => api.getPaginated<any>('/personas', params),
  findOne: (id: number) => api.get<any>(`/personas/${id}`),
  create: (data: any) => api.post<any>('/personas', data),
  update: (id: number, data: any) => api.put<any>(`/personas/${id}`, data),
  delete: (id: number) => api.delete<any>(`/personas/${id}`),
  search: (termino: string) => api.get<any[]>(`/personas/search?q=${termino}`),
};

export const pagosApi = {
  findAll: () => api.get<any[]>('/pagos'),
  findOne: (id: number) => api.get<any>(`/pagos/${id}`),
  create: (data: any) => api.post<any>('/pagos', data),
  update: (id: number, data: any) => api.put<any>(`/pagos/${id}`, data),
  delete: (id: number) => api.delete<any>(`/pagos/${id}`),
};

export const cuotasApi = {
  findAll: () => api.get<any[]>('/cuotas'),
  findOne: (id: number) => api.get<any>(`/cuotas/${id}`),
  pendientes: () => api.get<any[]>('/cuotas/pendientes'),
  create: (data: any) => api.post<any>('/cuotas', data),
  update: (id: number, data: any) => api.put<any>(`/cuotas/${id}`, data),
  delete: (id: number) => api.delete<any>(`/cuotas/${id}`),
};

export const cementeriosApi = {
  findAll: () => api.get<any[]>('/cementerios'),
  findOne: (id: number) => api.get<any>(`/cementerios/${id}`),
  create: (data: any) => api.post<any>('/cementerios', data),
  update: (id: number, data: any) => api.put<any>(`/cementerios/${id}`, data),
  delete: (id: number) => api.delete<any>(`/cementerios/${id}`),
};

export const gadInformacionApi = {
  get: () => api.get<any>('/cementerios/gad-informacion'),
  update: (data: any) => api.put<any>('/cementerios/gad-informacion', data),
};

export const bloquesApi = {
  findAll: () => api.get<any[]>('/bloques'),
  findPage: (params?: PaginationParams) => api.getPaginated<any>('/bloques', params),
  findOne: (id: number) => api.get<any>(`/bloques/${id}`),
  create: (data: any) => api.post<any>('/bloques', data),
  update: (id: number, data: any) => api.patch<any>(`/bloques/${id}`, data),
  delete: (id: number) => api.delete<any>(`/bloques/${id}`),
};

export const usuariosApi = {
  findAll: (q?: string) => api.get<any[]>(`/usuarios${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  findPage: (params?: PaginationParams) => api.getPaginated<any>('/usuarios', params),
  findOne: (id: string) => api.get<any>(`/usuarios/${id}`),
  update: (id: string, data: any) => api.put<any>(`/usuarios/${id}`, data),
  updateEstado: (id: string, estado: boolean) => api.patch<any>(`/usuarios/${id}/estado`, { estado }),
  setRoles: (id: string, roleIds: string[]) => api.put<any>(`/usuarios/${id}/roles`, { roleIds }),
  resetPassword: (id: string, notifyByEmail = true) =>
    api.post<{ success: boolean; emailSent: boolean; tempPassword: string | null }>(
      `/usuarios/${id}/reset-password`,
      { notifyByEmail },
    ),
  remove: (id: string) => api.delete<any>(`/usuarios/${id}`),
};

export const rolesApi = {
  findAll: () => api.get<any[]>('/roles'),
  findOne: (id: string) => api.get<any>(`/roles/${id}`),
  create: (data: any) => api.post<any>('/roles', data),
  update: (id: string, data: any) => api.put<any>(`/roles/${id}`, data),
  delete: (id: string) => api.delete<any>(`/roles/${id}`),
};

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v && v.length > 0);
  if (entries.length === 0) return '';
  const sp = new URLSearchParams(entries as [string, string][]);
  return `?${sp.toString()}`;
}

export const reportesApi = {
  resumen: (params: { desde?: string; hasta?: string } = {}) =>
    api.get<any>(`/reportes/resumen${qs(params)}`),
  ingresos: (params: { desde?: string; hasta?: string } = {}) =>
    api.get<any>(`/reportes/ingresos${qs(params)}`),
  cuentasPorCobrar: () => api.get<any>('/reportes/cuentas-por-cobrar'),
  bovedas: (params: { tipo?: string; bloque?: string; estado?: string } = {}) =>
    api.get<any>(`/reportes/bovedas${qs(params)}`),
  bloques: () => api.get<any>('/reportes/bloques'),
  comparativa: () => api.get<any>('/reportes/comparativa'),
};
export const notificacionesApi = {
  findPage: (params?: PaginationParams & { leida?: boolean }) =>
    api.getPaginated<any>('/notificaciones', params),
  findOne: (id: number) => api.get<any>(`/notificaciones/${id}`),
  markRead: (id: number) => api.patch<any>(`/notificaciones/${id}/leida`),
};

export const catastroApi = {
  list: (params?: PaginationParams) =>
    api.getPaginated<any>('/catastro/imports', params),
  detail: (id: number) => api.get<any>(`/catastro/imports/${id}`),
};

export const inventarioCategoriasApi = {
  findAll: (includeInactive = false) =>
    api.get<any[]>(
      `/inventario/categorias${includeInactive ? '?includeInactive=true' : ''}`,
    ),
  findPage: (params?: PaginationParams) =>
    api.getPaginated<any>('/inventario/categorias', params),
  findOne: (id: number) => api.get<any>(`/inventario/categorias/${id}`),
  create: (data: any) => api.post<any>('/inventario/categorias', data),
  update: (id: number, data: any) =>
    api.patch<any>(`/inventario/categorias/${id}`, data),
  delete: (id: number) => api.delete<any>(`/inventario/categorias/${id}`),
};

export const inventarioCustodiosApi = {
  findAll: (includeInactive = false) =>
    api.get<any[]>(
      `/inventario/custodios${includeInactive ? '?includeInactive=true' : ''}`,
    ),
  findPage: (params?: PaginationParams) =>
    api.getPaginated<any>('/inventario/custodios', params),
  findOne: (id: number) => api.get<any>(`/inventario/custodios/${id}`),
  create: (data: any) => api.post<any>('/inventario/custodios', data),
  update: (id: number, data: any) =>
    api.patch<any>(`/inventario/custodios/${id}`, data),
  delete: (id: number) => api.delete<any>(`/inventario/custodios/${id}`),
};

export const inventarioBienesApi = {
  findPage: (params?: PaginationParams) =>
    api.getPaginated<any>('/inventario/bienes', params),
  findOne: (id: number) => api.get<any>(`/inventario/bienes/${id}`),
  create: (data: any) => api.post<any>('/inventario/bienes', data),
  update: (id: number, data: any) => api.put<any>(`/inventario/bienes/${id}`, data),
  delete: (id: number) => api.delete<any>(`/inventario/bienes/${id}`),
  historial: (id: number) => api.get<any[]>(`/inventario/bienes/${id}/historial`),
  depreciacion: (id: number) =>
    api.get<any>(`/inventario/bienes/${id}/depreciacion`),
  reasignarCustodio: (id: number, data: any) =>
    api.post<any>(`/inventario/bienes/${id}/reasignar-custodio`, data),
  mover: (id: number, data: any) =>
    api.post<any>(`/inventario/bienes/${id}/mover`, data),
  baja: (id: number, data: any) =>
    api.post<any>(`/inventario/bienes/${id}/baja`, data),
  reactivar: (id: number, data: any) =>
    api.post<any>(`/inventario/bienes/${id}/reactivar`, data),
};

export interface DepreciacionFila {
  id: number;
  codigo: string;
  descripcion: string;
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  fechaAdquisicion: string;
  valorAdquisicion: number;
  estadoConservacion: string;
  ubicacion: string | null;
  dadoDeBaja: boolean;
  categoriaId: number | null;
  categoriaNombre: string;
  custodioId: number | null;
  custodioNombre: string;
  valorResidual: number;
  vidaUtilMeses: number;
  depreciacionMensual: number;
  mesesTranscurridos: number;
  depreciacionAcumulada: number;
  valorEnLibros: number;
}

export interface ReporteDepreciacion {
  fechaCorte: string;
  filas: DepreciacionFila[];
  total: number;
}

export interface RecalcularDepreciacionResult {
  anio: number;
  mes: number;
  bienesProcesados: number;
  totalDepreciadoPeriodo: number;
}

export const inventarioDepreciacionApi = {
  /** Reporte de depreciación a una fecha de corte (valor en libros por bien). */
  reporte: (params?: {
    fechaCorte?: string;
    categoriaId?: number | string;
    custodioId?: number | string;
    ubicacion?: string;
    incluirBajas?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, String(value));
        }
      });
    }
    const qs = query.toString();
    return api.get<ReporteDepreciacion>(
      `/inventario/reportes/depreciacion${qs ? `?${qs}` : ''}`,
    );
  },
  /** Recalcula y persiste la depreciación de un periodo (solo Administrador). */
  recalcular: (anio: number, mes: number) =>
    api.post<RecalcularDepreciacionResult>('/inventario/depreciacion/recalcular', {
      anio,
      mes,
    }),
};
