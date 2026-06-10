import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DepreciacionService } from './depreciacion.service';
import {
  RecalcularDepreciacionDto,
  RecalcularDepreciacionResponseDto,
} from './dto/depreciacion.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('inventario-depreciacion')
@ApiBearerAuth()
@Controller('inventario/depreciacion')
export class DepreciacionController {
  constructor(private service: DepreciacionService) {}

  @Post('recalcular')
  @Roles('Administrador', 'Admin')
  @ApiOperation({
    summary:
      'Recalcular la depreciación de un periodo (solo Administrador). ' +
      'Recorre los bienes activos no dados de baja y registra el periodo.',
  })
  @ApiResponse({ type: RecalcularDepreciacionResponseDto })
  recalcular(
    @Body() dto: RecalcularDepreciacionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.recalcularPeriodo(dto.anio, dto.mes, user.id);
  }
}
