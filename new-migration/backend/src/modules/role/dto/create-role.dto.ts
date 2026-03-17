import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { trimOptionalString, trimString } from '../../../common/dto/dto-transforms';
export class CreateRoleDto {
  @ApiProperty({ example: 'Administrator' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'users:read,users:write' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  permissions?: string;
}