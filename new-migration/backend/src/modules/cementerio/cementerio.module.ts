import { Module } from '@nestjs/common';
import { CementerioService } from './cementerio.service';
import { CementerioController } from './cementerio.controller';

@Module({
  providers: [CementerioService],
  controllers: [CementerioController],
  exports: [CementerioService],
})
export class CementerioModule {}
