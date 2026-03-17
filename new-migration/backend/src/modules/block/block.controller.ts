import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BlockService } from './block.service';
import { BlockListQueryDto } from './block-list-query.dto';
import { CreateBlockDto } from './create-block.dto';
import { UpdateBlockDto } from './update-block.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('blocks')
@Controller('blocks')
export class BlockController {
  constructor(private readonly service: BlockService) {}

  @Get()
  list(@Query() query: BlockListQueryDto) {
    return this.service.list(query);
  }

  @Get('cemetery/:cemeteryId')
  listByCemetery(@Param('cemeteryId') cemeteryId: string) {
    return this.service.listByCemetery(cemeteryId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() data: CreateBlockDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() data: UpdateBlockDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
