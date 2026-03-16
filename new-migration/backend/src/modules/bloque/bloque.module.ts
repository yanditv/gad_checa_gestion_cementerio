import { Module } from '@nestjs/common';
import { BloqueService } from './bloque.service';
import { BloqueController } from './bloque.controller';

@Module({
  providers: [BloqueService],
  controllers: [BloqueController],
  exports: [BloqueService],
})
export class BloqueModule {}
