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
import { BancoService } from './banco.service';
import { CreateBancoDto, UpdateBancoDto } from './dto/banco.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('bancos')
@ApiBearerAuth()
@Controller('bancos')
export class BancoController {
  constructor(private service: BancoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar bancos' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Crear banco (solo Administrador)' })
  create(@Body() dto: CreateBancoDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({ summary: 'Actualizar banco (solo Administrador)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBancoDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Administrador', 'Admin')
  @ApiOperation({
    summary: 'Eliminar (lógicamente) banco (solo Administrador)',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
