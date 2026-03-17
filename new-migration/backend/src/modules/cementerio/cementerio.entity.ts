export class Cementerio {
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  isActive?: boolean;

  constructor(data?: Partial<Cementerio>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Cementerio>): Cementerio {
    return new Cementerio(data);
  }
}