import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriaBienService } from './categoria-bien.service';
import {
  CategoriaBienResponseDto,
  CreateCategoriaBienDto,
  UpdateCategoriaBienDto,
} from './dto/categoria-bien.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Paginated } from '../../common/decorators/paginated.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('inventario-categorias')
@ApiBearerAuth()
@Controller('inventario/categorias')
export class CategoriaBienController {
  constructor(private service: CategoriaBienService) {}

  @Get()
  @Paginated()
  @ApiOperation({ summary: 'Listar categorías de bienes (paginado)' })
  @ApiResponse({ type: CategoriaBienResponseDto, isArray: true })
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.service.findPage(query, includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de categoría' })
  @ApiResponse({ type: CategoriaBienResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Crear categoría (solo Administrador)' })
  @ApiResponse({ type: CategoriaBienResponseDto })
  create(
    @Body() dto: CreateCategoriaBienDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Actualizar categoría (solo Administrador)' })
  @ApiResponse({ type: CategoriaBienResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoriaBienDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Eliminar (lógicamente) categoría (solo Administrador)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }
}
