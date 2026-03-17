import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ContractService } from './contract.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AvailableVaultsQueryDto } from './dto/available-vaults-query.dto';
import { ContractIdParamDto } from './dto/contract-id-param.dto';
import { ContractListQueryDto } from './dto/contract-list-query.dto';
import { ContractNumberPreviewQueryDto } from './dto/contract-number-preview-query.dto';
import { CreateContractRequestDto } from './dto/create-contract-request.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@ApiTags('contracts')
@Controller('contracts')
export class ContractController {
  constructor(private readonly service: ContractService) {}

  @Get()
  @ApiOperation({ summary: 'List contracts' })
  @ApiOkResponse({ description: 'Paginated contract list returned successfully.' })
  list(@Query() query: ContractListQueryDto) {
    return this.service.list(query);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get contract reports' })
  @ApiOkResponse({ description: 'Contract reporting data returned successfully.' })
  getReports() {
    return this.service.getReports();
  }

  @Get('create-metadata')
  @ApiOperation({ summary: 'Get contract creation metadata' })
  @ApiOkResponse({ description: 'Contract creation metadata returned successfully.' })
  getCreationMetadata() {
    return this.service.getCreationMetadata();
  }

  @Get('available-vaults')
  @ApiOperation({ summary: 'List vaults available for contracts' })
  @ApiOkResponse({ description: 'Available vaults returned successfully.' })
  getAvailableVaults(@Query() query: AvailableVaultsQueryDto) {
    return this.service.getAvailableVaults(query);
  }

  @Get('sequential-number')
  @ApiOperation({ summary: 'Preview next contract number' })
  @ApiOkResponse({ description: 'Contract numbering preview returned successfully.' })
  getContractNumberPreview(@Query() query: ContractNumberPreviewQueryDto) {
    return this.service.getContractNumberPreview(query.resolvedVaultId, query.resolvedIsRenewal);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by id' })
  @ApiParam({ name: 'id', description: 'Contract identifier.' })
  @ApiOkResponse({ description: 'Contract returned successfully.' })
  @ApiNotFoundResponse({ description: 'Contract not found.' })
  getById(@Param() params: ContractIdParamDto) {
    return this.service.getById(params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create contract' })
  @ApiBody({ type: CreateContractRequestDto })
  @ApiOkResponse({ description: 'Contract created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid contract payload.' })
  create(@Body() data: CreateContractRequestDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contract' })
  @ApiParam({ name: 'id', description: 'Contract identifier.' })
  @ApiBody({ type: UpdateContractDto })
  @ApiOkResponse({ description: 'Contract updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid contract payload.' })
  @ApiNotFoundResponse({ description: 'Contract not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  update(@Param() params: ContractIdParamDto, @Body() data: UpdateContractDto) {
    return this.service.update(params.id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate contract' })
  @ApiParam({ name: 'id', description: 'Contract identifier.' })
  @ApiNoContentResponse({ description: 'Contract deactivated successfully.' })
  @ApiNotFoundResponse({ description: 'Contract not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  remove(@Param() params: ContractIdParamDto) {
    return this.service.remove(params.id);
  }
}
