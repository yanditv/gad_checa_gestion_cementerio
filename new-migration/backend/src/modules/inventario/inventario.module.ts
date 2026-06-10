import { Module } from '@nestjs/common';
import { CategoriaBienController } from './categoria-bien.controller';
import { CategoriaBienService } from './categoria-bien.service';
import { CustodioController } from './custodio.controller';
import { CustodioService } from './custodio.service';
import { BienController } from './bien.controller';
import { BienService } from './bien.service';
import { DepreciacionController } from './depreciacion.controller';
import { DepreciacionService } from './depreciacion.service';
import { ReporteInventarioController } from './reporte-inventario.controller';
import { ReporteInventarioService } from './reporte-inventario.service';

@Module({
  controllers: [
    CategoriaBienController,
    CustodioController,
    BienController,
    DepreciacionController,
    ReporteInventarioController,
  ],
  providers: [
    CategoriaBienService,
    CustodioService,
    BienService,
    DepreciacionService,
    ReporteInventarioService,
  ],
  exports: [
    CategoriaBienService,
    CustodioService,
    BienService,
    DepreciacionService,
    ReporteInventarioService,
  ],
})
export class InventarioModule {}
