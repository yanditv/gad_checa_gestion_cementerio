export class Deceased {
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

  constructor(data?: Partial<Deceased>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Deceased>): Deceased {
    return new Deceased(data);
  }
}