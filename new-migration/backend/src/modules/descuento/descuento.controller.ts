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
import { DescuentoService } from './descuento.service';
import {
  CreateDescuentoDto,
  UpdateDescuentoDto,
} from './dto/descuento.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('descuentos')
@ApiBearerAuth()
@Controller('descuentos')
export class DescuentoController {
  constructor(private service: DescuentoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar descuentos' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Crear descuento (solo Administrador)' })
  create(
    @Body() dto: CreateDescuentoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Actualizar descuento (solo Administrador)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDescuentoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({
    summary: 'Eliminar (lógicamente) descuento (solo Administrador)',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }
}
