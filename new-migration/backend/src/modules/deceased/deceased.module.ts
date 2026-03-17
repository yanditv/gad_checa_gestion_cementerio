import { Module } from '@nestjs/common';
import { DeceasedService } from './deceased.service';
import { DeceasedController } from './deceased.controller';
import { DeceasedRepository } from './deceased.repository';

@Module({
  providers: [DeceasedService, DeceasedRepository],
  controllers: [DeceasedController],
  exports: [DeceasedService],
})
export class DeceasedModule {}
