import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VaultService } from './vault.service';
import { CreateVaultDto } from './create-vault.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateVaultDto } from './update-vault.dto';
import { VaultListQueryDto } from './vault-list-query.dto';

@ApiTags('vaults')
@Controller('vaults')
export class VaultController {
  constructor(private readonly service: VaultService) {}

  @Get()
  list(@Query() query: VaultListQueryDto) {
    return this.service.list(query);
  }

  @Get('block/:blockId')
  listByBlock(@Param('blockId') blockId: string) {
    return this.service.listByBlock(blockId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() data: CreateVaultDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() data: UpdateVaultDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
