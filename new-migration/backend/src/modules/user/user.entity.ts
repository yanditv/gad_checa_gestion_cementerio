export class User {
  identificationNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  identificationType?: string;
  password: string;
  active?: boolean;

  constructor(data?: Partial<User>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<User>): User {
    return new User(data);
  }
}