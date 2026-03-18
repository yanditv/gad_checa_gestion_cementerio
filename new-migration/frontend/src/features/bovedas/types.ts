export const BOVEDA_TYPES = ['Vault', 'Niche', 'Tomb'] as const;

export const BOVEDA_TYPE_LABELS: Record<(typeof BOVEDA_TYPES)[number], string> = {
  Vault: 'Boveda',
  Niche: 'Nicho',
  Tomb: 'Mausoleo',
};

export type BovedaType = (typeof BOVEDA_TYPES)[number] | (string & {});

export interface BlockOption {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  cemeteryId?: string | null;
}

export interface CreateBovedaFormValues {
  numero: string;
  bloqueId: string;
  tipo: BovedaType;
  capacidad: string;
  precio: string;
  precioArrendamiento: string;
  ubicacion: string;
  observaciones: string;
  estado: boolean;
}

export interface CreateBovedaPayload {
  number: string;
  blockId: string;
  type: BovedaType;
  capacity: number;
  price?: number;
  rentalPrice?: number;
  location?: string;
  notes?: string;
  isActive: boolean;
  floorId?: string | null;
  ownerId?: string | null;
}

export const defaultCreateBovedaValues: CreateBovedaFormValues = {
  numero: '',
  bloqueId: '',
  tipo: 'Vault',
  capacidad: '1',
  precio: '',
  precioArrendamiento: '',
  ubicacion: '',
  observaciones: '',
  estado: true,
};