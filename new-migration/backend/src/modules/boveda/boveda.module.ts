import { Module } from '@nestjs/common';
import { BovedaService } from './boveda.service';
import { BovedaController } from './boveda.controller';

@Module({
  providers: [BovedaService],
  controllers: [BovedaController],
  exports: [BovedaService],
})
export class BovedaModule {}
