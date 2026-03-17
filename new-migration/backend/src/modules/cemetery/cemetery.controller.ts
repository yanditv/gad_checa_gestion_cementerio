import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CemeteryService } from './cemetery.service';
import { CreateCemeteryDto } from './dto/create-cemetery.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UpdateCemeteryDto } from './dto/update-cemetery.dto';

@ApiTags('cemeteries')
@Controller('cemeteries')
export class CemeteryController {
  constructor(private readonly service: CemeteryService) {}

  @Get()
  @ApiOperation({ summary: 'List cemeteries' })
  @ApiOkResponse({ description: 'Cemeteries returned successfully.' })
  list() {
    return this.service.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cemetery by id' })
  @ApiParam({ name: 'id', description: 'Cemetery identifier.' })
  @ApiOkResponse({ description: 'Cemetery returned successfully.' })
  @ApiNotFoundResponse({ description: 'Cemetery not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create cemetery' })
  @ApiBody({ type: CreateCemeteryDto })
  @ApiOkResponse({ description: 'Cemetery created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid cemetery payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  create(@Body() data: CreateCemeteryDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cemetery' })
  @ApiParam({ name: 'id', description: 'Cemetery identifier.' })
  @ApiBody({ type: UpdateCemeteryDto })
  @ApiOkResponse({ description: 'Cemetery updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid cemetery payload.' })
  @ApiNotFoundResponse({ description: 'Cemetery not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  update(@Param('id') id: string, @Body() data: UpdateCemeteryDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate cemetery' })
  @ApiParam({ name: 'id', description: 'Cemetery identifier.' })
  @ApiNoContentResponse({ description: 'Cemetery deactivated successfully.' })
  @ApiNotFoundResponse({ description: 'Cemetery not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
