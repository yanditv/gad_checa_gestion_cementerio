import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get()
  @ApiOperation({ summary: 'List payments' })
  @ApiOkResponse({ description: 'Payments returned successfully.' })
  list() {
    return this.service.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by id' })
  @ApiParam({ name: 'id', description: 'Payment identifier.' })
  @ApiOkResponse({ description: 'Payment returned successfully.' })
  @ApiNotFoundResponse({ description: 'Payment not found.' })
  getById(@Param() params: IdParamDto) {
    return this.service.getById(params.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiOkResponse({ description: 'Payment created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid payment payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  create(@Body() data: CreatePaymentDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment' })
  @ApiParam({ name: 'id', description: 'Payment identifier.' })
  @ApiBody({ type: UpdatePaymentDto })
  @ApiOkResponse({ description: 'Payment updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid payment payload.' })
  @ApiNotFoundResponse({ description: 'Payment not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  update(@Param() params: IdParamDto, @Body() data: UpdatePaymentDto) {
    return this.service.update(params.id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate payment' })
  @ApiParam({ name: 'id', description: 'Payment identifier.' })
  @ApiNoContentResponse({ description: 'Payment deactivated successfully.' })
  @ApiNotFoundResponse({ description: 'Payment not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  remove(@Param() params: IdParamDto) {
    return this.service.remove(params.id);
  }
}
