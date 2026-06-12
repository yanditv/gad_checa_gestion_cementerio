import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DifuntoService } from './difunto.service';
import { MAX_IMAGE_SIZE_BYTES } from '../../common/storage/photo.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateDifuntoDto, UpdateDifuntoDto } from './dto/difunto.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('difuntos')
@ApiBearerAuth()
@Controller('difuntos')
export class DifuntoController {
  constructor(private service: DifuntoService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get('boveda/:bovedaId')
  findByBoveda(@Param('bovedaId', ParseIntPipe) bovedaId: number) {
    return this.service.findByBoveda(bovedaId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDifuntoDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDifuntoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Patch(':id')
  patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDifuntoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('Administrador')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }

  // -------- Foto del difunto (opcional) --------

  @Post(':id/foto')
  @ApiOperation({
    summary: 'Subir o reemplazar la foto del difunto',
    description: 'Multipart/form-data. Campo "file" (JPG/PNG/WEBP ≤ 5 MB).',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }),
  )
  subirFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.uploadFoto(id, file, user.id);
  }

  @Get(':id/foto')
  @ApiOperation({ summary: 'Servir la foto del difunto' })
  async verFoto(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, contentType } = await this.service.getFoto(id);
    res.set({ 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    return new StreamableFile(stream);
  }

  @Delete(':id/foto')
  @ApiOperation({ summary: 'Eliminar la foto del difunto' })
  eliminarFoto(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.removeFoto(id, user.id);
  }
}
