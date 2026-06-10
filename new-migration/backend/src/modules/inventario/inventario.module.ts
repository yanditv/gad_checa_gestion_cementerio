import { Module } from '@nestjs/common';
import { CategoriaBienController } from './categoria-bien.controller';
import { CategoriaBienService } from './categoria-bien.service';
import { CustodioController } from './custodio.controller';
import { CustodioService } from './custodio.service';
import { BienController } from './bien.controller';
import { BienService } from './bien.service';

@Module({
  controllers: [CategoriaBienController, CustodioController, BienController],
  providers: [CategoriaBienService, CustodioService, BienService],
  exports: [CategoriaBienService, CustodioService, BienService],
})
export class InventarioModule {}
