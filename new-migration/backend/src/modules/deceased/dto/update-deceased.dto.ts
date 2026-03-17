import { PartialType } from '@nestjs/swagger';
import { CreateDeceasedDto } from './create-deceased.dto';

export class UpdateDeceasedDto extends PartialType(CreateDeceasedDto) {}