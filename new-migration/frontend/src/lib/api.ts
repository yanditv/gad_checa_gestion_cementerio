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
  iniciarSesion: (email: string, password: string) => 
    api.post<{ user: any; token: string }>('/auth/login', { email, password }),
  registrar: (data: any) => 
    api.post<{ user: any; token: string }>('/auth/register', data),
  obtenerPerfil: () => api.get<any>('/auth/profile'),
};

export const contratosApi = {
  findAll: () => api.get<any[]>('/contratos'),
  findPage: (params?: PaginationParams) => api.getPaginated<any>('/contratos', params),
  obtenerMetadatosCreacion: () =>
    api['isBrowser']()
      ? api['requestRelative']<any>('/api/contratos/create-metadata', { method: 'GET', cache: 'no-store' })
      : api.get<any>('/contratos/create-metadata'),
  obtenerNumeroSecuencial: (bovedaId?: number, isRenovacion?: boolean) =>
    api['isBrowser']()
      ? api['requestRelative']<any>(
          `/api/contratos/numero-secuencial${bovedaId ? `?bovedaId=${bovedaId}&isRenovacion=${Boolean(isRenovacion)}` : ''}`,
          { method: 'GET', cache: 'no-store' },
        )
      : api.get<any>(`/contratos/numero-secuencial${bovedaId ? `?bovedaId=${bovedaId}&isRenovacion=${Boolean(isRenovacion)}` : ''}`),
  obtenerBovedasDisponibles: (params?: PaginationParams) =>
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
  obtenerReportes: () => api.get<any>('/contratos/reportes'),
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
  buscar: (termino: string) => api.get<any[]>(`/personas/search?q=${termino}`),
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

export const bloquesApi = {
  findAll: () => api.get<any[]>('/bloques'),
  findPage: (params?: PaginationParams) => api.getPaginated<any>('/bloques', params),
  findOne: (id: number) => api.get<any>(`/bloques/${id}`),
  create: (data: any) => api.post<any>('/bloques', data),
  update: (id: number, data: any) => api.put<any>(`/bloques/${id}`, data),
  delete: (id: number) => api.delete<any>(`/bloques/${id}`),
};

export const usuariosApi = {
  findAll: (q?: string) => api.get<any[]>(`/usuarios${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  findOne: (id: string) => api.get<any>(`/usuarios/${id}`),
  update: (id: string, data: any) => api.put<any>(`/usuarios/${id}`, data),
  actualizarEstado: (id: string, estado: boolean) => api.patch<any>(`/usuarios/${id}/estado`, { estado }),
  asignarRoles: (id: string, roleIds: string[]) => api.put<any>(`/usuarios/${id}/roles`, { roleIds }),
};

export const rolesApi = {
  findAll: () => api.get<any[]>('/roles'),
  findOne: (id: string) => api.get<any>(`/roles/${id}`),
  create: (data: any) => api.post<any>('/roles', data),
  update: (id: string, data: any) => api.put<any>(`/roles/${id}`, data),
  delete: (id: string) => api.delete<any>(`/roles/${id}`),
};
