export class Vault {
  id?: string;
  number?: string;
  capacity?: number;
  type?: string;
  isActive?: boolean;
  notes?: string;
  location?: string;
  price?: number;
  rentalPrice?: number;
  blockId?: string;
  floorId?: string;
  ownerId?: string;

  constructor(data?: Partial<Vault>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Vault>): Vault {
    return new Vault(data);
  }
}