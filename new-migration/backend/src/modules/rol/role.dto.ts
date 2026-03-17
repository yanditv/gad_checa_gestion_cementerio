import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Administrator' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'users:read,users:write' })
  @IsOptional()
  @IsString()
  permissions?: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Administrator' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'users:read,users:write' })
  @IsOptional()
  @IsString()
  permissions?: string;
}