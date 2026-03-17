import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePersonDto } from './create-person.dto';
import { PersonListQueryDto } from './person-list-query.dto';
import { PersonSearchQueryDto } from './person-search-query.dto';
import { PersonService } from './person.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePersonDto } from './update-person.dto';

@ApiTags('people')
@Controller('people')
export class PersonController {
  constructor(private readonly service: PersonService) {}

  @Get()
  list(@Query() query: PersonListQueryDto) {
    return this.service.list(query);
  }

  @Get('search')
  search(@Query() query: PersonSearchQueryDto) {
    return this.service.search(query.q);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() data: CreatePersonDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() data: UpdatePersonDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
