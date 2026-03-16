import { Module } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { CuotaController } from './cuota.controller';

@Module({
  providers: [CuotaService],
  controllers: [CuotaController],
  exports: [CuotaService],
})
export class CuotaModule {}
