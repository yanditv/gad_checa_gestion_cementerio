import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PersonaService } from './persona.service';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { UpdatePersonaDto } from './dto/request/update-persona.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { QueryPersonaDto } from './dto/request/query-persona.dto';

@ApiTags('personas')
@ApiBearerAuth()
@Controller('personas')
export class PersonaController {
  constructor(private service: PersonaService) {}

  @Get()
  findAll(@Query() query: QueryPersonaDto) {
    return this.service.findAll(query, query.tipo);
  }

  @Get('search')
  search(@Query('q') termino: string) {
    return this.service.search(termino);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: UpdatePersonaDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('Administrador')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }
}
