export class Bloque {
  id?: number;
  nombre?: string;
  descripcion?: string;
  estado?: boolean;
  cementerioId?: number;

  constructor(data?: Partial<Bloque>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Bloque>): Bloque {
    return new Bloque(data);
  }
}