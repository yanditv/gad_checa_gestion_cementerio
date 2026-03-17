export class Cuota {
  id?: string;
  number?: number;
  amount?: number;
  paidAt?: Date | null;
  isActive?: boolean;
  contractId?: string;

  constructor(data?: Partial<Cuota>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Cuota>): Cuota {
    return new Cuota(data);
  }
}