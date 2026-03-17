import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './update-user.dto';
import { UpdateUserStatusDto } from './update-user-status.dto';
import { UserListQueryDto } from './user-list-query.dto';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  list(@Query() query: UserListQueryDto) {
    return this.service.list(query.resolvedSearch);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateUserStatusDto) {
    return this.service.updateStatus(id, body.isActive)
  }
}
