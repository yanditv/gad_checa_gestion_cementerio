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
import { CustodioService } from './custodio.service';
import {
  CreateCustodioDto,
  CustodioResponseDto,
  UpdateCustodioDto,
} from './dto/custodio.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('inventario-custodios')
@ApiBearerAuth()
@Controller('inventario/custodios')
export class CustodioController {
  constructor(private service: CustodioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar custodios' })
  @ApiResponse({ type: CustodioResponseDto, isArray: true })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de custodio' })
  @ApiResponse({ type: CustodioResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Crear custodio (solo Administrador)' })
  @ApiResponse({ type: CustodioResponseDto })
  create(@Body() dto: CreateCustodioDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Actualizar custodio (solo Administrador)' })
  @ApiResponse({ type: CustodioResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustodioDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Eliminar (lógicamente) custodio (solo Administrador)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }
}
