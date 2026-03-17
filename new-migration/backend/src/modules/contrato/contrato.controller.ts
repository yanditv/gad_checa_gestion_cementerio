import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContratoService } from './contrato.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AvailableVaultsQueryDto,
  ContractIdParamDto,
  ContractListQueryDto,
  ContractNumberPreviewQueryDto,
  CreateContractDto,
  UpdateContractDto,
} from './contract.dto';

@ApiTags('contracts')
@Controller('contracts')
export class ContratoController {
  constructor(private readonly service: ContratoService) {}

  @Get()
  list(@Query() query: ContractListQueryDto) {
    return this.service.list(query);
  }

  @Get('reports')
  getReports() {
    return this.service.getReports();
  }

  @Get('create-metadata')
  getCreationMetadata() {
    return this.service.getCreationMetadata();
  }

  @Get('available-vaults')
  getAvailableVaults(@Query() query: AvailableVaultsQueryDto) {
    return this.service.getAvailableVaults(query, query.type || query.tipo);
  }

  @Get('sequential-number')
  getContractNumberPreview(@Query() query: ContractNumberPreviewQueryDto) {
    return this.service.getContractNumberPreview(
      query.vaultId ?? query.bovedaId,
      query.isRenewal ?? query.isRenovacion ?? false,
    );
  }

  @Get(':id')
  getById(@Param() params: ContractIdParamDto) {
    return this.service.getById(params.id);
  }

  @Post()
  create(@Body() data: CreateContractDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param() params: ContractIdParamDto, @Body() data: UpdateContractDto) {
    return this.service.update(params.id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param() params: ContractIdParamDto) {
    return this.service.remove(params.id);
  }
}
