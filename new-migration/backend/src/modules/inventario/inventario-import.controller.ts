import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InventarioImportService } from './inventario-import.service';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  InventarioImportListItemDto,
  InventarioImportResponseDto,
} from './dto/inventario-import.dto';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('inventario')
@ApiBearerAuth()
@Controller('inventario/import')
export class InventarioImportController {
  constructor(private service: InventarioImportService) {}

  @Get()
  @Roles('Administrador', 'Admin')
  @ApiOperation({
    summary: 'Historial paginado de importaciones de inventario de bienes',
  })
  @ApiResponse({ type: InventarioImportListItemDto, isArray: true })
  list(@Query() query: PaginationQueryDto) {
    return this.service.listImports(query);
  }

  @Get('last')
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Estado de la última importación de inventario' })
  @ApiResponse({ type: InventarioImportResponseDto })
  last() {
    return this.service.getLast();
  }

  @Get(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({
    summary: 'Detalle de una importación de inventario (con errores)',
  })
  @ApiResponse({ type: InventarioImportResponseDto })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getImport(id);
  }

  @Post()
  @Roles('Administrador', 'Admin')
  @ApiOperation({
    summary:
      'Subir un Excel de bienes y ejecutar la importación on-demand. Upsert sin borrado destructivo.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_BYTES },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No se recibió ningún archivo. Sube un Excel en el campo "file".',
      );
    }
    if (!isExcel(file)) {
      throw new BadRequestException(
        'El archivo debe ser un Excel (.xlsx, .xls).',
      );
    }
    return this.service.runImport(
      file.originalname || 'inventario.xlsx',
      file.buffer,
      user.id,
    );
  }
}

function isExcel(file: Express.Multer.File): boolean {
  const name = (file.originalname || '').toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return true;
  const mt = (file.mimetype || '').toLowerCase();
  return (
    mt.includes('spreadsheet') ||
    mt.includes('excel') ||
    mt === 'application/octet-stream'
  );
}
