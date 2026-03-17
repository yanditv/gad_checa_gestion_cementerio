export class CreateContractInstallmentDto {
  number!: number;
  amount!: number;
  dueDate!: Date;
  paidAt?: Date | null;
}