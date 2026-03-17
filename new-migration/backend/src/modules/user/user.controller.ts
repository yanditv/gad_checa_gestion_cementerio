import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ description: 'Users returned successfully.' })
  list(@Query() query: UserListQueryDto) {
    return this.service.list(query.resolvedSearch);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', description: 'User identifier.' })
  @ApiOkResponse({ description: 'User returned successfully.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User identifier.' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'User updated successfully.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'id', description: 'User identifier.' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiOkResponse({ description: 'User status updated successfully.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  updateStatus(@Param('id') id: string, @Body() body: UpdateUserStatusDto) {
    return this.service.updateStatus(id, body.isActive)
  }
}
