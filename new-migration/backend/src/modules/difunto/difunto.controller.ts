import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DifuntoService } from './difunto.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('deceased')
@Controller('deceased')
export class DifuntoController {
  constructor(private readonly service: DifuntoService) {}

  @Get()
  list(@Query() query: any) {
    return this.service.list(query);
  }

  @Get('vault/:vaultId')
  listByVault(@Param('vaultId') vaultId: string) {
    return this.service.listByVault(Number(vaultId));
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
