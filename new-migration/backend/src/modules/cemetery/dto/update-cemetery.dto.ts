import { PartialType } from '@nestjs/swagger';
import { CreateCemeteryDto } from './create-cemetery.dto';

export class UpdateCemeteryDto extends PartialType(CreateCemeteryDto) {}