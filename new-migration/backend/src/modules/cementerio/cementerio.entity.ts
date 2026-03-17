export class Cementerio {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  ruc?: string;
  estado?: boolean;

  constructor(data?: Partial<Cementerio>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Cementerio>): Cementerio {
    return new Cementerio(data);
  }
}