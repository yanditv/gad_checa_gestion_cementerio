import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateInstallmentDto } from './create-installment.dto';
import { InstallmentService } from './installment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateInstallmentDto } from './update-installment.dto';

@ApiTags('installments')
@Controller('installments')
export class InstallmentController {
  constructor(private readonly service: InstallmentService) {}

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
    return this.service.listByContract(contractId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() data: CreateInstallmentDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() data: UpdateInstallmentDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
