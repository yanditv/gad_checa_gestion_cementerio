export class Payment {
  id?: string;
  receiptNumber?: string;
  amount?: number;
  paidAt?: Date;
  paymentMethod?: string;
  reference?: string;
  note?: string;
  isActive?: boolean;
  bankId?: string | null;

  constructor(data?: Partial<Payment>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Payment>): Payment {
    return new Payment(data);
  }
}