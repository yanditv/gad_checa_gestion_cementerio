import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreateDeceasedDto } from './dto/create-deceased.dto';
import { DeceasedListQueryDto } from './dto/deceased-list-query.dto';
import { DeceasedService } from './deceased.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UpdateDeceasedDto } from './dto/update-deceased.dto';

@ApiTags('deceased')
@Controller('deceased')
export class DeceasedController {
  constructor(private readonly service: DeceasedService) {}

  @Get()
  @ApiOperation({ summary: 'List deceased records' })
  @ApiOkResponse({ description: 'Paginated deceased list returned successfully.' })
  list(@Query() query: DeceasedListQueryDto) {
    return this.service.list(query);
  }

  @Get('vault/:vaultId')
  @ApiOperation({ summary: 'List deceased records by vault' })
  @ApiParam({ name: 'vaultId', description: 'Vault identifier.' })
  @ApiOkResponse({ description: 'Deceased records for the vault returned successfully.' })
  listByVault(@Param('vaultId') vaultId: string) {
    return this.service.listByVault(vaultId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deceased record by id' })
  @ApiParam({ name: 'id', description: 'Deceased identifier.' })
  @ApiOkResponse({ description: 'Deceased record returned successfully.' })
  @ApiNotFoundResponse({ description: 'Deceased record not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create deceased record' })
  @ApiBody({ type: CreateDeceasedDto })
  @ApiOkResponse({ description: 'Deceased record created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid deceased payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  create(@Body() data: CreateDeceasedDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update deceased record' })
  @ApiParam({ name: 'id', description: 'Deceased identifier.' })
  @ApiBody({ type: UpdateDeceasedDto })
  @ApiOkResponse({ description: 'Deceased record updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid deceased payload.' })
  @ApiNotFoundResponse({ description: 'Deceased record not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  update(@Param('id') id: string, @Body() data: UpdateDeceasedDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate deceased record' })
  @ApiParam({ name: 'id', description: 'Deceased identifier.' })
  @ApiNoContentResponse({ description: 'Deceased record deactivated successfully.' })
  @ApiNotFoundResponse({ description: 'Deceased record not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
