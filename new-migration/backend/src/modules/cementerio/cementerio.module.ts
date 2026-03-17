import { Module } from '@nestjs/common';
import { CementerioService } from './cementerio.service';
import { CementerioController } from './cementerio.controller';
import { CementerioRepository } from './repositories/cementerio.repository';

@Module({
  providers: [CementerioService, CementerioRepository],
  controllers: [CementerioController],
  exports: [CementerioService],
})
export class CementerioModule {}
