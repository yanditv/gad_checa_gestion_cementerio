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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BienService } from './bien.service';
import {
  BienListItemDto,
  BienResponseDto,
  CreateBienDto,
  QueryBienDto,
  UpdateBienDto,
} from './dto/bien.dto';
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
  constructor(private service: BienService) {}

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

  @Delete(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Eliminar (lógicamente) un bien (solo Administrador)' })
  @ApiResponse({ type: BienResponseDto })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.id);
  }
}
