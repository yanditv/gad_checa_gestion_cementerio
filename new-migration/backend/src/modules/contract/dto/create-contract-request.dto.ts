import { BadRequestException } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { trimOptionalString, trimString } from '../../../common/dto/dto-transforms';
import { CreateContractDeceasedDto } from '../../deceased/dto/create-contract-deceased.dto';
import { CreateContractInstallmentDto } from '../../installment/dto/create-contract-installment.dto';
import { CreateInstallmentPaymentDto } from '../../payment/dto/create-installment-payment.dto';
import { ResolveContractResponsibleDto } from '../../person/dto/resolve-contract-responsible.dto';
import { CreateContractDto } from './create-contract.dto';

export class CreateContractWizardInstallmentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  number?: number;

  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @Type(() => Date)
  @IsDate()
  dueDate!: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date | null;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPaid?: boolean;

  toInstallmentDto(index: number, paymentDate: Date): CreateContractInstallmentDto {
    const dto = new CreateContractInstallmentDto();
    dto.number = index + 1;

    if (Number.isFinite(this.number)) {
      dto.number = Number(this.number);
    }

    dto.amount = requireNumber(this.amount, 'Installment amount is required.');
    dto.dueDate = requireDate(this.dueDate, 'Installment due date is required.');

    if (this.paidAt !== undefined) {
      dto.paidAt = this.paidAt;
    } else {
      dto.paidAt = null;
    }

    if (this.isPaid) {
      dto.paidAt = paymentDate;
    }

    return dto;
  }
}

export class CreateContractWizardContractDto {
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  sequentialNumber?: string | null;

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date | null;

  @Type(() => Number)
  @IsNumber()
  monthCount!: number;

  @Type(() => Number)
  @IsNumber()
  totalAmount!: number;

  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  notes?: string | null;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRenewal?: boolean;

  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  sourceContractId?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  relatedContractId?: string | null;

  @Transform(({ value }) => trimString(value))
  @IsUUID()
  vaultId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContractWizardInstallmentDto)
  installments?: CreateContractWizardInstallmentDto[];

  get resolvedSequentialNumber(): string | undefined {
    return this.sequentialNumber ?? undefined;
  }

  get resolvedStartDate(): Date {
    return requireDate(this.startDate, 'Contract start date is required.');
  }

  get resolvedEndDate(): Date | null {
    return this.endDate ?? null;
  }

  get resolvedMonthCount(): number {
    return requireInteger(this.monthCount, 'Contract month count is required.');
  }

  get resolvedTotalAmount(): number {
    return requireNumber(this.totalAmount, 'Contract total amount is required.');
  }

  get resolvedNotes(): string | null {
    return this.notes ?? null;
  }

  get resolvedIsRenewal(): boolean {
    return this.isRenewal ?? false;
  }

  get resolvedSourceContractId(): string | null {
    return this.sourceContractId ?? null;
  }

  get resolvedRelatedContractId(): string | null {
    return this.relatedContractId ?? null;
  }

  get resolvedVaultId(): string {
    if (!this.vaultId) {
      throw new BadRequestException('Vault id is required.');
    }

    return this.vaultId;
  }

  toInstallmentDtos(paymentDate: Date): CreateContractInstallmentDto[] {
    return (this.installments ?? []).map((installment, index) => installment.toInstallmentDto(index, paymentDate));
  }
}

export class CreateContractWizardPaymentDto {
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date;

  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  paymentMethod?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  reference?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  note?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  bankId?: string | null;

  @IsOptional()
  @IsArray()
  selectedInstallmentNumbers?: number[];

  get resolvedAmount(): number {
    return requireNumber(this.amount, 'Payment amount is required.');
  }

  get resolvedPaidAt(): Date {
    return this.paidAt ?? new Date();
  }

  get resolvedSelectedInstallmentNumbers(): number[] {
    return Array.isArray(this.selectedInstallmentNumbers)
      ? this.selectedInstallmentNumbers.map((item) => Number(item)).filter((item) => Number.isFinite(item))
      : [];
  }

  toInstallmentPaymentDto(installmentIds: string[]): CreateInstallmentPaymentDto {
    const dto = new CreateInstallmentPaymentDto();
    dto.amount = this.resolvedAmount;
    dto.paidAt = this.resolvedPaidAt;
    dto.paymentMethod = this.paymentMethod ?? null;
    dto.reference = this.reference ?? null;
    dto.note = this.note ?? null;
    dto.bankId = this.bankId ?? null;
    dto.installmentIds = installmentIds;
    return dto;
  }
}

export class CreateContractRequestDto extends PartialType(CreateContractDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateContractWizardContractDto)
  contract?: CreateContractWizardContractDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateContractDeceasedDto)
  deceased?: CreateContractDeceasedDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1)
  @ValidateNested({ each: true })
  @Type(() => ResolveContractResponsibleDto)
  responsibles?: ResolveContractResponsibleDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateContractWizardPaymentDto)
  payment?: CreateContractWizardPaymentDto;

  get isWizardPayload(): boolean {
    return Boolean(this.contract && this.deceased && this.responsibles && this.payment);
  }

  get wizardContract(): CreateContractWizardContractDto {
    if (!this.contract) {
      throw new BadRequestException('Contract payload is required.');
    }

    return this.contract;
  }

  get wizardDeceased(): CreateContractDeceasedDto {
    if (!this.deceased) {
      throw new BadRequestException('Deceased payload is required.');
    }

    return this.deceased;
  }

  get wizardResponsibles(): ResolveContractResponsibleDto[] {
    if (!Array.isArray(this.responsibles) || this.responsibles.length === 0) {
      throw new BadRequestException('A vault must have one responsible party.');
    }

    if (this.responsibles.length > 1) {
      throw new BadRequestException('A vault can only have one responsible party.');
    }

    return this.responsibles;
  }

  get wizardPayment(): CreateContractWizardPaymentDto {
    if (!this.payment) {
      throw new BadRequestException('Payment payload is required.');
    }

    return this.payment;
  }

  buildDeceasedDto(): CreateContractDeceasedDto {
    const dto = new CreateContractDeceasedDto();
    Object.assign(dto, this.wizardDeceased, { vaultId: this.wizardContract.resolvedVaultId });
    return dto;
  }
}

function requireDate(value: Date | null | undefined, message: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new BadRequestException(message);
  }

  return value;
}

function requireNumber(value: number | null | undefined, message: string): number {
  const normalizedValue = Number(value);
  if (!Number.isFinite(normalizedValue)) {
    throw new BadRequestException(message);
  }

  return normalizedValue;
}

function requireInteger(value: number | null | undefined, message: string): number {
  const normalizedValue = requireNumber(value, message);
  if (!Number.isInteger(normalizedValue)) {
    throw new BadRequestException(message);
  }

  return normalizedValue;
}