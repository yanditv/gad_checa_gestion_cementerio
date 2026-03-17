import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleService } from './role.service';

@ApiTags('roles')
@Controller('roles')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get()
  @ApiOperation({ summary: 'List roles' })
  @ApiOkResponse({ description: 'Roles returned successfully.' })
  list() {
    return this.service.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by id' })
  @ApiParam({ name: 'id', description: 'Role identifier.' })
  @ApiOkResponse({ description: 'Role returned successfully.' })
  @ApiNotFoundResponse({ description: 'Role not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiOkResponse({ description: 'Role created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid role payload.' })
  create(@Body() data: CreateRoleDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', description: 'Role identifier.' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiOkResponse({ description: 'Role updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid role payload.' })
  @ApiNotFoundResponse({ description: 'Role not found.' })
  update(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', description: 'Role identifier.' })
  @ApiNoContentResponse({ description: 'Role deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Role not found.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
