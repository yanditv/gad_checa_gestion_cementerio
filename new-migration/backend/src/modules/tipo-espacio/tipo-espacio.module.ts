import { Module } from '@nestjs/common';
import { TipoEspacioService } from './tipo-espacio.service';
import { TipoEspacioController } from './tipo-espacio.controller';

@Module({
  providers: [TipoEspacioService],
  controllers: [TipoEspacioController],
  exports: [TipoEspacioService],
})
export class TipoEspacioModule {}
