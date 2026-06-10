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
import { InventarioImportController } from './inventario-import.controller';
import { InventarioImportService } from './inventario-import.service';

@Module({
  controllers: [
    CategoriaBienController,
    CustodioController,
    BienController,
    DepreciacionController,
    ReporteInventarioController,
    InventarioImportController,
  ],
  providers: [
    CategoriaBienService,
    CustodioService,
    BienService,
    DepreciacionService,
    ReporteInventarioService,
    InventarioImportService,
  ],
  exports: [
    CategoriaBienService,
    CustodioService,
    BienService,
    DepreciacionService,
    ReporteInventarioService,
    InventarioImportService,
  ],
})
export class InventarioModule {}
