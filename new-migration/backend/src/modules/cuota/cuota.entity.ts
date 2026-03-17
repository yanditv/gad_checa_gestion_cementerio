export class Cuota {
  id?: number;
  numero?: number;
  monto?: number;
  pagada?: boolean;
  estado?: boolean;
  contratoId?: number;

  constructor(data?: Partial<Cuota>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Cuota>): Cuota {
    return new Cuota(data);
  }
}