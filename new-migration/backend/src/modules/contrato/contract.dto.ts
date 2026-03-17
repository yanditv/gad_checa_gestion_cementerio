export class ContractDto {
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vaultId?: number;

  @ApiPropertyOptional({ example: '2026-03-16' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-03-16' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  monthCount?: number;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({ example: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isRenewal?: boolean;

  @ApiPropertyOptional({ example: [1, 2] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  responsibleIds?: number[];

  @ApiPropertyOptional({ type: ContractWizardDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContractWizardDetailsDto)
  contract?: ContractWizardDetailsDto;

  @ApiPropertyOptional({ type: CreateDeceasedDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDeceasedDto)
  deceased?: CreateDeceasedDto;

  @ApiPropertyOptional({ type: [CreateContractResponsibleDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateContractResponsibleDto)
  responsibles?: CreateContractResponsibleDto[];

  @ApiPropertyOptional({ type: ContractPaymentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContractPaymentDto)
  payment?: ContractPaymentDto;
}