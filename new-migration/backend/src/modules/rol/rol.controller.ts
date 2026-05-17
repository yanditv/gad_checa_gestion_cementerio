import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolService } from './rol.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateRolDto } from './dto/request/update-rol.dto';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolController {
  constructor(private service: RolService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('Administrador')
  create(@Body() dto: UpdateRolDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('Administrador')
  update(@Param('id') id: string, @Body() dto: UpdateRolDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Administrador')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
