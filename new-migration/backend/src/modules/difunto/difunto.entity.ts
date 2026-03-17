export class Difunto {
  id?: number;
  nombre?: string;
  apellido?: string;
  numeroIdentificacion?: string;
  causaMuerte?: string;
  observaciones?: string;
  edad?: number;
  genero?: string;
  estado?: boolean;
  bovedaId?: number;

  constructor(data?: Partial<Difunto>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Difunto>): Difunto {
    return new Difunto(data);
  }
}