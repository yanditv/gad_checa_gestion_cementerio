import { Module } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { CuotaController } from './cuota.controller';
import { CuotaRepository } from './repositories/cuota.repository';

@Module({
  providers: [CuotaService, CuotaRepository],
  controllers: [CuotaController],
  exports: [CuotaService],
})
export class CuotaModule {}
