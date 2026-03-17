import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { BlockService } from './block.service';
import { BlockListQueryDto } from './dto/block-list-query.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('blocks')
@Controller('blocks')
export class BlockController {
  constructor(private readonly service: BlockService) {}

  @Get()
  @ApiOperation({ summary: 'List blocks' })
  @ApiOkResponse({ description: 'Paginated block list returned successfully.' })
  list(@Query() query: BlockListQueryDto) {
    return this.service.list(query);
  }

  @Get('cemetery/:cemeteryId')
  @ApiOperation({ summary: 'List blocks by cemetery' })
  @ApiParam({ name: 'cemeteryId', description: 'Cemetery identifier.' })
  @ApiOkResponse({ description: 'Blocks for the cemetery returned successfully.' })
  listByCemetery(@Param('cemeteryId') cemeteryId: string) {
    return this.service.listByCemetery(cemeteryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get block by id' })
  @ApiParam({ name: 'id', description: 'Block identifier.' })
  @ApiOkResponse({ description: 'Block returned successfully.' })
  @ApiNotFoundResponse({ description: 'Block not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create block' })
  @ApiBody({ type: CreateBlockDto })
  @ApiOkResponse({ description: 'Block created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid block payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  create(@Body() data: CreateBlockDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update block' })
  @ApiParam({ name: 'id', description: 'Block identifier.' })
  @ApiBody({ type: UpdateBlockDto })
  @ApiOkResponse({ description: 'Block updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid block payload.' })
  @ApiNotFoundResponse({ description: 'Block not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  update(@Param('id') id: string, @Body() data: UpdateBlockDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate block' })
  @ApiParam({ name: 'id', description: 'Block identifier.' })
  @ApiNoContentResponse({ description: 'Block deactivated successfully.' })
  @ApiNotFoundResponse({ description: 'Block not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
