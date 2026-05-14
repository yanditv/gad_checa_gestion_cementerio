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
  ApiTags,
} from '@nestjs/swagger';
import { CatastroService } from './catastro.service';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('catastro')
@ApiBearerAuth()
@Controller('catastro')
export class CatastroController {
  constructor(private service: CatastroService) {}

  @Get('imports')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Historial paginado de importaciones de catastro' })
  list(@Query() query: PaginationQueryDto) {
    return this.service.listImports(query);
  }

  @Get('imports/:id')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Detalle de una importación (con errores)' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getImport(id);
  }

  @Post('import')
  @Roles('Administrador')
  @ApiOperation({
    summary:
      'Subir un Excel del catastro y ejecutar la importación on-demand. Upsert sin borrado destructivo.',
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
      file.originalname || 'catastro.xlsx',
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
