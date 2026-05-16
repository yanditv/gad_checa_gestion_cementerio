import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CuotaService } from './cuota.service';
import { UpdateCuotaDto } from './dto/request/update-cuota.dto';

@ApiTags('cuotas')
@ApiBearerAuth()
@Controller('cuotas')
export class CuotaController {
  constructor(private service: CuotaService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('pendientes')
  pendientes() {
    return this.service.pendientes();
  }

  @Get('contrato/:contratoId')
  findByContrato(@Param('contratoId') contratoId: string) {
    return this.service.findByContrato(+contratoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() dto: UpdateCuotaDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCuotaDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
