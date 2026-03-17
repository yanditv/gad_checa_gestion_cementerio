export class Pago {
  id?: string;
  receiptNumber?: string;
  amount?: number;
  paidAt?: Date;
  paymentMethod?: string;
  reference?: string;
  note?: string;
  isActive?: boolean;
  bankId?: string | null;

  constructor(data?: Partial<Pago>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Pago>): Pago {
    return new Pago(data);
  }
}