import { Module } from '@nestjs/common';
import { DifuntoService } from './difunto.service';
import { DifuntoController } from './difunto.controller';
import { ExhumacionService } from './exhumacion.service';
import { ExhumacionController } from './exhumacion.controller';

@Module({
  providers: [DifuntoService, ExhumacionService],
  controllers: [DifuntoController, ExhumacionController],
  exports: [DifuntoService, ExhumacionService],
})
export class DifuntoModule {}
