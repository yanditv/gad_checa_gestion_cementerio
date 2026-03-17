import { Module } from '@nestjs/common';
import { RolController } from './rol.controller';
import { RolRepository } from './rol.repository';
import { RolService } from './rol.service';

@Module({
  controllers: [RolController],
  providers: [RolService, RolRepository],
})
export class RolModule {}
