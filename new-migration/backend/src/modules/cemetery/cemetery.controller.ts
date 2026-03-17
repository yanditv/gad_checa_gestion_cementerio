import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CemeteryService } from './cemetery.service';
import { CreateCemeteryDto } from './create-cemetery.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateCemeteryDto } from './update-cemetery.dto';

@ApiTags('cemeteries')
@Controller('cemeteries')
export class CemeteryController {
  constructor(private readonly service: CemeteryService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() data: CreateCemeteryDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() data: UpdateCemeteryDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
