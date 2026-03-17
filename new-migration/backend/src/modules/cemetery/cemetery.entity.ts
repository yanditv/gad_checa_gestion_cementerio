export class Cemetery {
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  isActive?: boolean;

  constructor(data?: Partial<Cemetery>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Cemetery>): Cemetery {
    return new Cemetery(data);
  }
}