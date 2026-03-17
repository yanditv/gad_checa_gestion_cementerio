import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { trimOptionalString } from '../../../common/dto/dto-transforms';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Administrator' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'users:read,users:write' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  permissions?: string;
}