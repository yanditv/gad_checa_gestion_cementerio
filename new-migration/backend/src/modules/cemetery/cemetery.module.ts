import { Module } from '@nestjs/common';
import { CemeteryService } from './cemetery.service';
import { CemeteryController } from './cemetery.controller';
import { CemeteryRepository } from './cemetery.repository';

@Module({
  providers: [CemeteryService, CemeteryRepository],
  controllers: [CemeteryController],
  exports: [CemeteryService],
})
export class CemeteryModule {}
