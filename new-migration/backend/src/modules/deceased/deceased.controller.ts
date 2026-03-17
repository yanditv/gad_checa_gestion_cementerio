import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateDeceasedDto } from './create-deceased.dto';
import { DeceasedListQueryDto } from './deceased-list-query.dto';
import { DeceasedService } from './deceased.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateDeceasedDto } from './update-deceased.dto';

@ApiTags('deceased')
@Controller('deceased')
export class DeceasedController {
  constructor(private readonly service: DeceasedService) {}

  @Get()
  list(@Query() query: DeceasedListQueryDto) {
    return this.service.list(query);
  }

  @Get('vault/:vaultId')
  listByVault(@Param('vaultId') vaultId: string) {
    return this.service.listByVault(vaultId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() data: CreateDeceasedDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() data: UpdateDeceasedDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
