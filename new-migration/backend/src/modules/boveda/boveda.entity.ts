export class Boveda {
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

  constructor(data?: Partial<Boveda>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Boveda>): Boveda {
    return new Boveda(data);
  }
}