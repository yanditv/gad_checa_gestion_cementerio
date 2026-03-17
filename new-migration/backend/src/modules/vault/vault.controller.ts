import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { VaultService } from './vault.service';
import { CreateVaultDto } from './dto/create-vault.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UpdateVaultDto } from './dto/update-vault.dto';
import { VaultListQueryDto } from './dto/vault-list-query.dto';

@ApiTags('vaults')
@Controller('vaults')
export class VaultController {
  constructor(private readonly service: VaultService) {}

  @Get()
  @ApiOperation({ summary: 'List vaults' })
  @ApiOkResponse({ description: 'Paginated vault list returned successfully.' })
  list(@Query() query: VaultListQueryDto) {
    return this.service.list(query);
  }

  @Get('block/:blockId')
  @ApiOperation({ summary: 'List vaults by block' })
  @ApiParam({ name: 'blockId', description: 'Block identifier.' })
  @ApiOkResponse({ description: 'Vaults for the block returned successfully.' })
  listByBlock(@Param('blockId') blockId: string) {
    return this.service.listByBlock(blockId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vault by id' })
  @ApiParam({ name: 'id', description: 'Vault identifier.' })
  @ApiOkResponse({ description: 'Vault returned successfully.' })
  @ApiNotFoundResponse({ description: 'Vault not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create vault' })
  @ApiBody({ type: CreateVaultDto })
  @ApiOkResponse({ description: 'Vault created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid vault payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  create(@Body() data: CreateVaultDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vault' })
  @ApiParam({ name: 'id', description: 'Vault identifier.' })
  @ApiBody({ type: UpdateVaultDto })
  @ApiOkResponse({ description: 'Vault updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid vault payload.' })
  @ApiNotFoundResponse({ description: 'Vault not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  update(@Param('id') id: string, @Body() data: UpdateVaultDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate vault' })
  @ApiParam({ name: 'id', description: 'Vault identifier.' })
  @ApiNoContentResponse({ description: 'Vault deactivated successfully.' })
  @ApiNotFoundResponse({ description: 'Vault not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
