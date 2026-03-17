import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BloqueService } from './bloque.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('blocks')
@Controller('blocks')
export class BloqueController {
  constructor(private readonly service: BloqueService) {}

  @Get()
  list(@Query() query: any) {
    return this.service.list(query);
  }

  @Get('cemetery/:cemeteryId')
  listByCemetery(@Param('cemeteryId') cemeteryId: string) {
    return this.service.listByCemetery(Number(cemeteryId));
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
