export class Role {
  id?: string;
  name?: string;
  normalizedName?: string;
  permissions?: string | null;

  constructor(data?: Partial<Role>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Role>): Role {
    return new Role(data);
  }
}
