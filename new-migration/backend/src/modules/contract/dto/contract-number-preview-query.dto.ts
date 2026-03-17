import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { toOptionalBoolean, trimOptionalString } from '../../../common/dto/dto-transforms';

export class ContractNumberPreviewQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptionalString(value))
  @IsUUID()
  vaultId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isRenewal?: boolean;

  get resolvedVaultId(): string | undefined {
    return this.vaultId;
  }

  get resolvedIsRenewal(): boolean {
    return this.isRenewal ?? false;
  }
}