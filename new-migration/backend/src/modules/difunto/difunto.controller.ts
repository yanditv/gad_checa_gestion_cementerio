import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DifuntoService } from './difunto.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateDifuntoDto, UpdateDifuntoDto } from './dto/difunto.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('difuntos')
@ApiBearerAuth()
@Controller('difuntos')
export class DifuntoController {
  constructor(private service: DifuntoService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get('boveda/:bovedaId')
  findByBoveda(@Param('bovedaId', ParseIntPipe) bovedaId: number) {
    return this.service.findByBoveda(bovedaId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('Administrador')
  create(@Body() dto: CreateDifuntoDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Put(':id')
  @Roles('Administrador')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDifuntoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Patch(':id')
  @Roles('Administrador')
  patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDifuntoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('Administrador')
  @Roles('Administrador')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }
}
