export class Person {
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

  constructor(data?: Partial<Person>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Person>): Person {
    return new Person(data);
  }
}