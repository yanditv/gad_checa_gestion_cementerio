import { Module } from '@nestjs/common';
import { BancoService } from './banco.service';
import { BancoController } from './banco.controller';

@Module({
  providers: [BancoService],
  controllers: [BancoController],
  exports: [BancoService],
})
export class BancoModule {}
