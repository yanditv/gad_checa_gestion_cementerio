export class CreateInstallmentPaymentDto {
  amount!: number;
  paidAt!: Date;
  paymentMethod?: string | null;
  reference?: string | null;
  note?: string | null;
  bankId?: string | null;
  installmentIds!: string[];
}