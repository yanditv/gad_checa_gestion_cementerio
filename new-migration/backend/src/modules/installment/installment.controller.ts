import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { InstallmentService } from './installment.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UpdateInstallmentDto } from './dto/update-installment.dto';

@ApiTags('installments')
@Controller('installments')
export class InstallmentController {
  constructor(private readonly service: InstallmentService) {}

  @Get()
  @ApiOperation({ summary: 'List installments' })
  @ApiOkResponse({ description: 'Installments returned successfully.' })
  list() {
    return this.service.list();
  }

  @Get('pending')
  @ApiOperation({ summary: 'List pending installments' })
  @ApiOkResponse({ description: 'Pending installments returned successfully.' })
  listPending() {
    return this.service.listPending();
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'List installments by contract' })
  @ApiParam({ name: 'contractId', description: 'Contract identifier.' })
  @ApiOkResponse({ description: 'Installments for the contract returned successfully.' })
  listByContract(@Param('contractId') contractId: string) {
    return this.service.listByContract(contractId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get installment by id' })
  @ApiParam({ name: 'id', description: 'Installment identifier.' })
  @ApiOkResponse({ description: 'Installment returned successfully.' })
  @ApiNotFoundResponse({ description: 'Installment not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create installment' })
  @ApiBody({ type: CreateInstallmentDto })
  @ApiOkResponse({ description: 'Installment created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid installment payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  create(@Body() data: CreateInstallmentDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update installment' })
  @ApiParam({ name: 'id', description: 'Installment identifier.' })
  @ApiBody({ type: UpdateInstallmentDto })
  @ApiOkResponse({ description: 'Installment updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid installment payload.' })
  @ApiNotFoundResponse({ description: 'Installment not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  update(@Param('id') id: string, @Body() data: UpdateInstallmentDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate installment' })
  @ApiParam({ name: 'id', description: 'Installment identifier.' })
  @ApiNoContentResponse({ description: 'Installment deactivated successfully.' })
  @ApiNotFoundResponse({ description: 'Installment not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
