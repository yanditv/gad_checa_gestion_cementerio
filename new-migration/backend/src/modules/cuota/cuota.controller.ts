import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CuotaService } from './cuota.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('installments')
@Controller('installments')
export class CuotaController {
  constructor(private readonly service: CuotaService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('pending')
  listPending() {
    return this.service.listPending();
  }

  @Get('contract/:contractId')
  listByContract(@Param('contractId') contractId: string) {
    return this.service.listByContract(Number(contractId));
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
