import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BovedaService } from './boveda.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('vaults')
@Controller('vaults')
export class BovedaController {
  constructor(private readonly service: BovedaService) {}

  @Get()
  list(@Query() query: any) {
    return this.service.list(query);
  }

  @Get('block/:blockId')
  listByBlock(@Param('blockId') blockId: string) {
    return this.service.listByBlock(Number(blockId));
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(Number(id), data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
