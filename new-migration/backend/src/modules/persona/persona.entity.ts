export class Persona {
  id?: string;
  identificationNumber?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  identificationType?: string;
  gender?: string;
  isActive?: boolean;
  personType?: string;

  constructor(data?: Partial<Persona>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Persona>): Persona {
    return new Persona(data);
  }
}