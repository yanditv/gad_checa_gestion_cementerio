import { Module } from '@nestjs/common';
import { DescuentoService } from './descuento.service';
import { DescuentoController } from './descuento.controller';

@Module({
  providers: [DescuentoService],
  controllers: [DescuentoController],
  exports: [DescuentoService],
})
export class DescuentoModule {}
