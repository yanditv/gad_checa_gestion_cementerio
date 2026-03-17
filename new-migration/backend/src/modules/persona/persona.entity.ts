export class Persona {
  id?: number;
  numeroIdentificacion?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipoIdentificacion?: string;
  genero?: string;
  estado?: boolean;
  tipoPersona?: string;

  constructor(data?: Partial<Persona>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Persona>): Persona {
    return new Persona(data);
  }
}