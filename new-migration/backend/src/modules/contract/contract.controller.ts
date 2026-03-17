import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContractService } from './contract.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AvailableVaultsQueryDto } from './available-vaults-query.dto';
import { ContractIdParamDto } from './contract-id-param.dto';
import { ContractListQueryDto } from './contract-list-query.dto';
import { ContractNumberPreviewQueryDto } from './contract-number-preview-query.dto';
import { CreateContractRequestDto } from './create-contract-request.dto';
import { UpdateContractDto } from './update-contract.dto';

@ApiTags('contracts')
@Controller('contracts')
export class ContractController {
  constructor(private readonly service: ContractService) {}

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
    return this.service.getAvailableVaults(query);
  }

  @Get('sequential-number')
  getContractNumberPreview(@Query() query: ContractNumberPreviewQueryDto) {
    return this.service.getContractNumberPreview(query.resolvedVaultId, query.resolvedIsRenewal);
  }

  @Get(':id')
  getById(@Param() params: ContractIdParamDto) {
    return this.service.getById(params.id);
  }

  @Post()
  create(@Body() data: CreateContractRequestDto) {
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
