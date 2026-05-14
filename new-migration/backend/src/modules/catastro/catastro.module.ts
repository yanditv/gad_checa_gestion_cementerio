import { Module } from '@nestjs/common';
import { CatastroController } from './catastro.controller';
import { CatastroService } from './catastro.service';

@Module({
  controllers: [CatastroController],
  providers: [CatastroService],
})
export class CatastroModule {}
