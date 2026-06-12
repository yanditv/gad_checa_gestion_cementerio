import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { PhotoService } from './photo.service';

@Global()
@Module({
  providers: [StorageService, PhotoService],
  exports: [StorageService, PhotoService],
})
export class StorageModule {}
