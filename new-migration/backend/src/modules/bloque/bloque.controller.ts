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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BloqueService } from './bloque.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateBloqueDto, UpdateBloqueDto } from './dto/bloque.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('bloques')
@ApiBearerAuth()
@Controller('bloques')
export class BloqueController {
  constructor(private service: BloqueService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get('cementerio/:cementerioId')
  findByCementerio(@Param('cementerioId', ParseIntPipe) cementerioId: number) {
    return this.service.findByCementerio(cementerioId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('Administrador')
  @ApiOperation({
    summary: 'Crear bloque (con autogeneración de N pisos si se indica)',
  })
  create(@Body() dto: CreateBloqueDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('Administrador')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBloqueDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('Administrador')
  @Roles('Administrador')
  @ApiOperation({
    summary: 'Eliminar bloque (lógico, falla si hay bóvedas activas)',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }
}
