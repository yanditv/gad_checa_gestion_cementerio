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
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { MAX_IMAGE_SIZE_BYTES } from '../../common/storage/photo.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUsuarioDto } from './dto/request/update-usuario.dto';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuarioController {
  constructor(private service: UsuarioService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  // -------- Avatar de la cuenta propia (sin rol admin) --------

  @Post('me/avatar')
  @ApiOperation({
    summary: 'Subir o reemplazar el avatar de la cuenta autenticada',
    description: 'Multipart/form-data. Campo "file" (JPG/PNG/WEBP ≤ 5 MB).',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }),
  )
  subirMiAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.uploadAvatar(user.id, file);
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Eliminar el avatar de la cuenta autenticada' })
  eliminarMiAvatar(@CurrentUser() user: AuthUser) {
    return this.service.removeAvatar(user.id);
  }

  @Get(':id/avatar')
  @ApiOperation({ summary: 'Servir el avatar de un usuario' })
  async verAvatar(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, contentType } = await this.service.getAvatar(id);
    res.set({ 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    return new StreamableFile(stream);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('Administrador')
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.service.update(id, dto);
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
