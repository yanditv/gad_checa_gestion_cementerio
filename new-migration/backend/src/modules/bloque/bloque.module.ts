import { Module } from '@nestjs/common';
import { BloqueService } from './bloque.service';
import { BloqueController } from './bloque.controller';
import { BloqueRepository } from './repositories/bloque.repository';

@Module({
  providers: [BloqueService, BloqueRepository],
  controllers: [BloqueController],
  exports: [BloqueService],
})
export class BloqueModule {}
