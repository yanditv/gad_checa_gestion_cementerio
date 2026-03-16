import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuarioController {
  constructor(private service: UsuarioService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body('estado') estado: boolean) {
    return this.service.updateEstado(id, !!estado);
  }

  @Put(':id/roles')
  setRoles(@Param('id') id: string, @Body('roleIds') roleIds: string[] = []) {
    return this.service.setRoles(id, roleIds);
  }
}
