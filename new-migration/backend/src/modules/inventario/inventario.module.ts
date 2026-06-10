import { Module } from '@nestjs/common';
import { CategoriaBienController } from './categoria-bien.controller';
import { CategoriaBienService } from './categoria-bien.service';
import { CustodioController } from './custodio.controller';
import { CustodioService } from './custodio.service';

@Module({
  controllers: [CategoriaBienController, CustodioController],
  providers: [CategoriaBienService, CustodioService],
  exports: [CategoriaBienService, CustodioService],
})
export class InventarioModule {}
