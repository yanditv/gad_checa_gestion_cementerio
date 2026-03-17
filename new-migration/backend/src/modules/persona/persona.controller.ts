import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PersonaService } from './persona.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('people')
@Controller('people')
export class PersonaController {
  constructor(private readonly service: PersonaService) {}

  @Get()
  list(@Query() query: any, @Query('tipo') type?: string) {
    return this.service.list(query, type);
  }

  @Get('search')
  search(@Query('q') term: string) {
    return this.service.search(term);
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
