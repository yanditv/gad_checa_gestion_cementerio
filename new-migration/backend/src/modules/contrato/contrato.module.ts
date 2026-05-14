import { Module } from '@nestjs/common';
import { ContratoService } from './contrato.service';
import { ContratoController } from './contrato.controller';
import { DocumentoService } from './documento.service';

@Module({
  providers: [ContratoService, DocumentoService],
  controllers: [ContratoController],
  exports: [ContratoService, DocumentoService],
})
export class ContratoModule {}
