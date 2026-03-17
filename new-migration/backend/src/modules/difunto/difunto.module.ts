import { Module } from '@nestjs/common';
import { DifuntoService } from './difunto.service';
import { DifuntoController } from './difunto.controller';
import { DifuntoRepository } from './repositories/difunto.repository';

@Module({
  providers: [DifuntoService, DifuntoRepository],
  controllers: [DifuntoController],
  exports: [DifuntoService],
})
export class DifuntoModule {}
