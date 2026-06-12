import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BienService } from './bien.service';
import { MAX_IMAGE_SIZE_BYTES } from '../../common/storage/photo.service';
import { DepreciacionService } from './depreciacion.service';
import { DepreciacionBienResponseDto } from './dto/depreciacion.dto';
import {
  BienListItemDto,
  BienResponseDto,
  CreateBienDto,
  QueryBienDto,
  UpdateBienDto,
} from './dto/bien.dto';
import {
  HistorialItemDto,
  MoverBienDto,
  ReasignarCustodioDto,
} from './dto/movimiento-bien.dto';
import { BajaBienDto, ReactivarBienDto } from './dto/baja-bien.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Paginated } from '../../common/decorators/paginated.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('inventario-bienes')
@ApiBearerAuth()
@Controller('inventario/bienes')
export class BienController {
  constructor(
    private service: BienService,
    private depreciacionService: DepreciacionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar bienes (paginado, con filtros y búsqueda)' })
  @Paginated()
  @ApiResponse({ type: BienListItemDto, isArray: true })
  findAll(@Query() query: QueryBienDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ficha de un bien' })
  @ApiResponse({ type: BienResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar (dar de alta) un bien; genera código si no se provee',
  })
  @ApiResponse({ type: BienResponseDto })
  create(@Body() dto: CreateBienDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Editar datos de un bien' })
  @ApiResponse({ type: BienResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBienDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Post(':id/reasignar-custodio')
  @ApiOperation({
    summary: 'Reasignar el custodio de un bien (registra el movimiento)',
  })
  @ApiResponse({ type: BienResponseDto })
  reasignarCustodio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReasignarCustodioDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reasignarCustodio(id, dto, user.id);
  }

  @Post(':id/mover')
  @ApiOperation({
    summary: 'Cambiar la ubicación de un bien (registra el movimiento)',
  })
  @ApiResponse({ type: BienResponseDto })
  mover(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoverBienDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.mover(id, dto, user.id);
  }

  @Get(':id/historial')
  @ApiOperation({
    summary:
      'Historial cronológico unificado del bien (movimientos + depreciaciones)',
  })
  @ApiResponse({ type: HistorialItemDto, isArray: true })
  historial(@Param('id', ParseIntPipe) id: number) {
    return this.service.historial(id);
  }

  @Get(':id/depreciacion')
  @ApiOperation({
    summary:
      'Tabla de depreciación de un bien (valor residual, mensual y periodos registrados)',
  })
  @ApiResponse({ type: DepreciacionBienResponseDto })
  depreciacion(@Param('id', ParseIntPipe) id: number) {
    return this.depreciacionService.depreciacionDeBien(id);
  }

  @Post(':id/baja')
  @Roles('Administrador', 'Admin')
  @ApiOperation({
    summary: 'Dar de baja un bien (solo Administrador); registra el movimiento',
  })
  @ApiResponse({ type: BienResponseDto })
  baja(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BajaBienDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.baja(id, dto, user.id);
  }

  @Post(':id/reactivar')
  @Roles('Administrador', 'Admin')
  @ApiOperation({
    summary:
      'Reactivar un bien dado de baja por error (solo Administrador); registra el movimiento',
  })
  @ApiResponse({ type: BienResponseDto })
  reactivar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReactivarBienDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reactivar(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Eliminar (lógicamente) un bien (solo Administrador)' })
  @ApiResponse({ type: BienResponseDto })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.id);
  }

  // -------- Foto del bien (opcional) --------

  @Post(':id/foto')
  @ApiOperation({
    summary: 'Subir o reemplazar la foto del bien',
    description: 'Multipart/form-data. Campo "file" (JPG/PNG/WEBP ≤ 5 MB).',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }),
  )
  @ApiResponse({ type: BienResponseDto })
  subirFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.uploadFoto(id, file, user.id);
  }

  @Get(':id/foto')
  @ApiOperation({ summary: 'Servir la foto del bien' })
  async verFoto(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, contentType } = await this.service.getFoto(id);
    res.set({ 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    return new StreamableFile(stream);
  }

  @Delete(':id/foto')
  @ApiOperation({ summary: 'Eliminar la foto del bien' })
  @ApiResponse({ type: BienResponseDto })
  eliminarFoto(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.removeFoto(id, user.id);
  }
}
