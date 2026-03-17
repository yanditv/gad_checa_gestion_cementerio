export class Pago {
  id?: number;
  numeroRecibo?: string;
  monto?: number;
  fechaPago?: Date;
  metodoPago?: string;
  referencia?: string;
  observacion?: string;
  estado?: boolean;
  bancoId?: number | null;

  constructor(data?: Partial<Pago>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Pago>): Pago {
    return new Pago(data);
  }
}