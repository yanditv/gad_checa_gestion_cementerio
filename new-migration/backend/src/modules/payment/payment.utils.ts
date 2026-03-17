import { PAYMENT_RECEIPT_PAD_LENGTH, PAYMENT_RECEIPT_PREFIX } from './payment.constants';

export function buildPaymentReceiptNumber(sequence: number, paidAt = new Date()): string {
  return `${PAYMENT_RECEIPT_PREFIX}-${paidAt.getFullYear()}-${sequence.toString().padStart(PAYMENT_RECEIPT_PAD_LENGTH, '0')}`;
}