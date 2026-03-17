import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserDto } from './user.dto';
import { UserService } from './usuario.service';

@ApiTags('users')
@Controller('usuarios')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  list(@Query('q') search?: string) {
    return this.service.list(search);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UserDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/estado')
  updateStatus(@Param('id') id: string, @Body() body: {isActive: boolean}) {
    return this.service.updateStatus(id, body.isActive)
  }
}
