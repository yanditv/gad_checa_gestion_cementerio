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

  /**
   * Descarga un recurso binario (PDF, XLSX, CSV) desde el backend a través del
   * proxy BFF `/api/*`, que anexa el JWT desde la cookie httpOnly. Devuelve el
   * Blob junto al nombre de archivo sugerido por `Content-Disposition`.
   */
  async downloadBlob(
    endpoint: string,
    params?: PaginationParams,
  ): Promise<{ blob: Blob; filename: string | null }> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(
      this.buildUrl(`${endpoint}${this.toQueryString(params)}`),
      { method: 'GET', headers, cache: 'no-store' },
    );

    if (!response.ok) {
      let message = `Error ${response.status}`;
      try {
        const payload = await response.json();
        message = payload?.message || payload?.error?.message || message;
      } catch {
        // respuesta sin cuerpo JSON: se conserva el mensaje genérico
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition');
    let filename: string | null = null;
    if (disposition) {
      const match = /filename="?([^"]+)"?/i.exec(disposition);
      if (match) filename = match[1];
    }
    return { blob, filename };
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

/** Motivos válidos de exhumación (paridad con backend `MOTIVOS_EXHUMACION`). */
export const MOTIVOS_EXHUMACION = [
  'vencimiento_arriendo',
  'traslado',
  'orden_judicial',
  'osario_comun',
  'otro',
] as const;

export type MotivoExhumacion = (typeof MOTIVOS_EXHUMACION)[number];

/** Etiquetas legibles en español para cada motivo de exhumación. */
export const MOTIVO_EXHUMACION_LABEL: Record<MotivoExhumacion, string> = {
  vencimiento_arriendo: 'Vencimiento de arriendo',
  traslado: 'Traslado',
  orden_judicial: 'Orden judicial',
  osario_comun: 'Osario común',
  otro: 'Otro',
};

export interface ExhumacionResponse {
  id: number;
  numeroActa: string;
  difuntoId: number;
  bovedaOrigenId: number;
  bovedaDestinoId: number | null;
  fechaExhumacion: string;
  motivo: MotivoExhumacion;
  destino: string;
  numeroAutorizacion: string | null;
  entidadAutorizante: string | null;
  observaciones: string | null;
  estado: boolean;
  fechaCreacion: string;
  difunto?: {
    id: number;
    nombre: string;
    apellido: string;
    numeroIdentificacion: string | null;
  };
  bovedaOrigen?: {
    id: number;
    numero: string;
    tipo: string | null;
  };
}

export interface CreateExhumacionPayload {
  difuntoId: number;
  fechaExhumacion: string;
  motivo: MotivoExhumacion;
  destino: string;
  bovedaDestinoId?: number;
  numeroAutorizacion?: string;
  entidadAutorizante?: string;
  observaciones?: string;
}

export const exhumacionesApi = {
  /**
   * Lista paginada de exhumaciones. El backend devuelve `{ items, meta }` que el
   * interceptor convierte en `{ success, data, meta }`; tras pasar por el proxy
   * BFF llega como `{ data, meta }`. Normalizamos a `{ data, meta }` aquí.
   */
  findPage: (
    params?: PaginationParams & {
      desde?: string;
      hasta?: string;
      bovedaId?: number;
      motivo?: MotivoExhumacion;
    },
  ) =>
    api.getPaginated<ExhumacionResponse>('/exhumaciones', params),
  findOne: (id: number) => api.get<ExhumacionResponse>(`/exhumaciones/${id}`),
  findByBoveda: (bovedaId: number) =>
    api.get<ExhumacionResponse[]>(`/exhumaciones/boveda/${bovedaId}`),
  /** Registrar exhumación/traslado (solo Administrador). */
  create: (data: CreateExhumacionPayload) =>
    api.post<ExhumacionResponse>('/exhumaciones', data),
  /** Anular exhumación, revierte el efecto (solo Administrador). */
  anular: (id: number) => api.post<ExhumacionResponse>(`/exhumaciones/${id}/anular`),
  /** Descarga el acta de exhumación en PDF (Blob + nombre sugerido). */
  actaPdf: (id: number) => api.downloadBlob(`/exhumaciones/${id}/pdf`),
  /** Descarga el historial de exhumaciones en el formato indicado. */
  descargarHistorial: (
    formato: 'pdf' | 'excel' | 'csv',
    params?: {
      desde?: string;
      hasta?: string;
      bovedaId?: number;
      motivo?: MotivoExhumacion;
    },
  ) =>
    api.downloadBlob(
      `/exhumaciones/reporte/${formato}`,
      params as PaginationParams | undefined,
    ),
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

/** Formatos de exportación admitidos por los reportes de inventario (REP-R2). */
export type FormatoReporteInventario = 'pdf' | 'excel' | 'csv';

/** Tipos de reporte de inventario disponibles. */
export type TipoReporteInventario =
  | 'por-custodio'
  | 'por-ubicacion'
  | 'por-categoria'
  | 'depreciacion'
  | 'acta-entrega';

export interface ReporteInventarioFiltros {
  categoriaId?: number | string;
  custodioId?: number | string;
  custodioSalienteId?: number | string;
  ubicacion?: string;
  incluirBajas?: boolean;
  fechaCorte?: string;
}

export const inventarioReportesApi = {
  /**
   * Descarga un reporte de inventario en el formato indicado golpeando
   * `/inventario/reportes/<tipo>/<pdf|excel|csv>`. La respuesta binaria se
   * resuelve como Blob con el nombre de archivo sugerido por el backend.
   */
  descargar: (
    tipo: TipoReporteInventario,
    formato: FormatoReporteInventario,
    filtros?: ReporteInventarioFiltros,
  ) =>
    api.downloadBlob(
      `/inventario/reportes/${tipo}/${formato}`,
      filtros as PaginationParams | undefined,
    ),
};

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
