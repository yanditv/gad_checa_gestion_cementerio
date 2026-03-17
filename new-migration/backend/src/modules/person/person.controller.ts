import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonListQueryDto } from './dto/person-list-query.dto';
import { PersonSearchQueryDto } from './dto/person-search-query.dto';
import { PersonService } from './person.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UpdatePersonDto } from './dto/update-person.dto';

@ApiTags('people')
@Controller('people')
export class PersonController {
  constructor(private readonly service: PersonService) {}

  @Get()
  @ApiOperation({ summary: 'List people' })
  @ApiOkResponse({ description: 'Paginated people list returned successfully.' })
  list(@Query() query: PersonListQueryDto) {
    return this.service.list(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search people' })
  @ApiOkResponse({ description: 'Matching people returned successfully.' })
  search(@Query() query: PersonSearchQueryDto) {
    return this.service.search(query.q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get person by id' })
  @ApiParam({ name: 'id', description: 'Person identifier.' })
  @ApiOkResponse({ description: 'Person returned successfully.' })
  @ApiNotFoundResponse({ description: 'Person not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create person' })
  @ApiBody({ type: CreatePersonDto })
  @ApiOkResponse({ description: 'Person created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid person payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  create(@Body() data: CreatePersonDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update person' })
  @ApiParam({ name: 'id', description: 'Person identifier.' })
  @ApiBody({ type: UpdatePersonDto })
  @ApiOkResponse({ description: 'Person updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid person payload.' })
  @ApiNotFoundResponse({ description: 'Person not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  update(@Param('id') id: string, @Body() data: UpdatePersonDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate person' })
  @ApiParam({ name: 'id', description: 'Person identifier.' })
  @ApiNoContentResponse({ description: 'Person deactivated successfully.' })
  @ApiNotFoundResponse({ description: 'Person not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
