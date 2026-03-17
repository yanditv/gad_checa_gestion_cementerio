export class Bloque {
  id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  cemeteryId?: string;

  constructor(data?: Partial<Bloque>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Bloque>): Bloque {
    return new Bloque(data);
  }
}