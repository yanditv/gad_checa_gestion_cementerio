import { Module } from '@nestjs/common';
import { BovedaService } from './boveda.service';
import { BovedaController } from './boveda.controller';
import { BovedaRepository } from './repositories/boveda.repository';

@Module({
  providers: [BovedaService, BovedaRepository],
  controllers: [BovedaController],
  exports: [BovedaService],
})
export class BovedaModule {}
