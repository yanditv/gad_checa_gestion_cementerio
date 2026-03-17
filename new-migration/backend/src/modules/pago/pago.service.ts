import { Injectable, NotFoundException } from '@nestjs/common';
import { Pago } from './pago.entity';
import { PagoRepository } from './repositories/pago.repository';

@Injectable()
export class PagoService {
  constructor(private readonly pagoRepository: PagoRepository) {}

  async list() {
    return this.pagoRepository.findMany();
  }

  async getById(id: number) {
    const payment = await this.pagoRepository.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async create(data: any) {
    const { installmentIds, cuotasIds, ...paymentData } = data;
    const selectedInstallmentIds = installmentIds ?? cuotasIds;

    const lastPayment = await this.pagoRepository.findLastPayment();
    const nextNumber = lastPayment ? lastPayment.id + 1 : 1;
    const receiptNumber = `REC-${new Date().getFullYear()}-${nextNumber.toString().padStart(5, '0')}`;
    const payment = Pago.create({
      ...paymentData,
      numeroRecibo: receiptNumber,
    });

    const createdPayment = await this.pagoRepository.create(payment, selectedInstallmentIds);

    if (selectedInstallmentIds) {
      await this.pagoRepository.updateInstallmentsAsPaid(selectedInstallmentIds, new Date());
    }

    return createdPayment;
  }

  async update(id: number, data: any) {
    await this.getById(id);

    const payment = Pago.create(data);

    return this.pagoRepository.update(id, payment);
  }

  async remove(id: number) {
    const payment = await this.getById(id);
    await this.pagoRepository.deleteInstallmentPaymentsByPagoId(id);
    await this.pagoRepository.updateInstallmentsAsPending(payment.cuotas.map((installment) => installment.cuotaId));
    return this.pagoRepository.update(id, Pago.create({ estado: false }));
  }
}
