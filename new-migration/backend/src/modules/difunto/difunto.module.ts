import { Module } from '@nestjs/common';
import { DifuntoService } from './difunto.service';
import { DifuntoController } from './difunto.controller';

@Module({
  providers: [DifuntoService],
  controllers: [DifuntoController],
  exports: [DifuntoService],
})
export class DifuntoModule {}
