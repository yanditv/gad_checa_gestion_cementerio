export class Difunto {
  id?: string;
  firstName?: string;
  lastName?: string;
  identificationNumber?: string;
  causeOfDeath?: string;
  notes?: string;
  age?: number;
  gender?: string;
  isActive?: boolean;
  vaultId?: string;

  constructor(data?: Partial<Difunto>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Difunto>): Difunto {
    return new Difunto(data);
  }
}