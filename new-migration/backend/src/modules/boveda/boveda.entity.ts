export class Boveda {
  id?: number;
  numero?: string;
  capacidad?: number;
  tipo?: string;
  estado?: boolean;
  observaciones?: string;
  ubicacion?: string;
  precio?: number;
  precioArrendamiento?: number;
  bloqueId?: number;
  pisoId?: number;
  propietarioId?: number;

  constructor(data?: Partial<Boveda>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Boveda>): Boveda {
    return new Boveda(data);
  }
}