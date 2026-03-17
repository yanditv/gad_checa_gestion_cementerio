export class Installment {
  id?: string;
  number?: number;
  amount?: number;
  dueDate?: Date;
  paidAt?: Date | null;
  isActive?: boolean;
  contractId?: string;

  constructor(data?: Partial<Installment>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Installment>): Installment {
    return new Installment(data);
  }
}