import { Module } from '@nestjs/common';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';
import { BlockRepository } from './block.repository';

@Module({
  providers: [BlockService, BlockRepository],
  controllers: [BlockController],
  exports: [BlockService],
})
export class BlockModule {}
