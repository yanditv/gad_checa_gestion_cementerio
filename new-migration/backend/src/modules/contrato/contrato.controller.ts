import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ContratoService } from './contrato.service';
import {
  DocumentoService,
  DocumentoTipo,
  MAX_DOCUMENT_SIZE_BYTES,
} from './documento.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RenovarContratoDto } from './dto/renovar-contrato.dto';
import { GetContratosQueryDto } from './dto/get-contratos-query.dto';
import { RelacionarContratosDto } from './dto/relacionar-contratos.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateContratoDto } from './dto/request/update-contrato.dto';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('contratos')
@ApiBearerAuth()
@Controller('contratos')
export class ContratoController {
  constructor(
    private service: ContratoService,
    private documentos: DocumentoService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar contratos paginados (con filtros)' })
  findAll(@Query() query: GetContratosQueryDto) {
    return this.service.findAll(query);
  }

  @Get('reportes')
  getReportes() {
    return this.service.getReportes();
  }

  @Get('create-metadata')
  getCreateMetadata() {
    return this.service.getCreateMetadata();
  }

  @Get('bovedas-disponibles')
  getBovedasDisponibles(
    @Query() query: PaginationQueryDto,
    @Query('tipo') tipo?: string,
  ) {
    return this.service.getBovedasDisponibles(query, tipo);
  }

  @Get('numero-secuencial')
  getNumeroSecuencial(
    @Query('bovedaId') bovedaId?: string,
    @Query('isRenovacion') isRenovacion?: string,
  ) {
    return this.service.getNumeroSecuencialPreview(
      bovedaId ? Number(bovedaId) : undefined,
      isRenovacion === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear contrato (wizard o simple)' })
  create(@Body() data: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return this.service.create(data, user.id);
  }

  @Post(':id/renovar')
  @ApiOperation({
    summary: 'Renovar un contrato existente',
    description:
      'Crea una renovación a partir del contrato indicado. Hereda bóveda y difunto del origen.',
  })
  renovar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RenovarContratoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.renovar(id, dto, user.id);
  }

  @Get(':id/candidatos-relacion')
  @ApiOperation({
    summary: 'Candidatos a relacionarse con este contrato',
    description:
      'Contratos activos en la misma bóveda, con difunto distinto y sin relación previa con un tercero.',
  })
  getCandidatosRelacion(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.getCandidatosRelacion(id, query);
  }

  @Post(':id/relacionar')
  @ApiOperation({
    summary: 'Relacionar dos contratos que comparten bóveda',
  })
  relacionar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RelacionarContratosDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.relacionar(id, dto, user.id);
  }

  @Delete(':id/relacionar')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Romper la relación lateral del contrato' })
  romperRelacion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.romperRelacion(id, user.id);
  }

  // -------- Documentos firmados --------

  @Get(':id/documentos')
  @ApiOperation({ summary: 'Listar documentos adjuntos del contrato' })
  listarDocumentos(@Param('id', ParseIntPipe) id: number) {
    return this.documentos.listByContrato(id);
  }

  @Post(':id/documentos')
  @ApiOperation({
    summary: 'Subir un documento PDF adjunto al contrato',
    description: 'Multipart/form-data. Campo "file" (PDF ≤ 10 MB).',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES },
    }),
  )
  subirDocumento(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('tipo') tipo: DocumentoTipo | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException('Falta el archivo (campo "file")');
    }
    return this.documentos.upload({
      contratoId: id,
      file,
      tipo,
      userId: user.id,
    });
  }

  @Get(':id/documentos/:docId/file')
  @ApiOperation({ summary: 'Descargar el archivo del documento' })
  async descargarDocumento(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { doc, stream } = await this.documentos.getForDownload(id, docId);
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `inline; filename="${doc.nombreOriginal}"`,
    });
    return new StreamableFile(stream);
  }

  @Delete(':id/documentos/:docId')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Eliminar (lógicamente) un documento adjunto' })
  eliminarDocumento(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentos.remove(id, docId, user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContratoDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @Roles('Administrador')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
