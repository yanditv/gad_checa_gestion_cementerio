import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cuota } from './cuota.entity';

@Injectable()
export class CuotaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.cuota.findUnique({
      where: { id },
      include: {
        contrato: { include: { difunto: true, boveda: true } },
        pagos: { include: { pago: true } },
      },
    });
  }

  create(data: Cuota) {
    return this.cuota.create({ data });
  }

  update(id: number, data: Partial<Cuota>) {
    return this.cuota.update({ where: { id }, data });
  }

  findActive() {
    return this.cuota.findMany({
      where: { estado: true },
      include: { contrato: { include: { difunto: true, boveda: true } }, pagos: { include: { pago: true } } },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  findByContract(contractId: number) {
    return this.cuota.findMany({
      where: { contratoId: contractId, estado: true },
      include: { pagos: { include: { pago: true } } },
      orderBy: { numero: 'asc' },
    });
  }

  findPending() {
    return this.cuota.findMany({
      where: { pagada: false, fechaVencimiento: { lte: new Date() }, estado: true },
      include: { contrato: { include: { difunto: true, boveda: true } } },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  private get cuota() {
    return this.prisma.cuota;
  }
}