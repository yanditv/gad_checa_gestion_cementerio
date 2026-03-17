import { Module } from '@nestjs/common';
import { VaultService } from './vault.service';
import { VaultController } from './vault.controller';
import { VaultRepository } from './vault.repository';

@Module({
  providers: [VaultService, VaultRepository],
  controllers: [VaultController],
  exports: [VaultService],
})
export class VaultModule {}
