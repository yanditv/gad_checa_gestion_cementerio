import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuarioController {
  constructor(private service: UsuarioService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('Administrador')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Patch(':id/estado')
  @Roles('Administrador')
  updateEstado(@Param('id') id: string, @Body('estado') estado: boolean) {
    return this.service.updateEstado(id, !!estado);
  }

  @Put(':id/roles')
  @Roles('Administrador')
  setRoles(@Param('id') id: string, @Body('roleIds') roleIds: string[] = []) {
    return this.service.setRoles(id, roleIds);
  }

  @Post(':id/reset-password')
  @Roles('Administrador')
  @ApiOperation({
    summary:
      'Reset administrativo de contraseña. Marca mustChangePassword=true y entrega contraseña temporal por email (si SMTP) o en la respuesta.',
  })
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(id, {
      notifyByEmail: dto.notifyByEmail,
    });
  }

  @Delete(':id')
  @Roles('Administrador')
  @ApiOperation({
    summary:
      'Eliminación lógica del usuario. Bloquea al super-admin y al usuario actual.',
  })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.id);
  }
}
