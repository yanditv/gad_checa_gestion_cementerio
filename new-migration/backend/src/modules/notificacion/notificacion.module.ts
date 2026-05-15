import { Module } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { NotificacionController } from './notificacion.controller';

@Module({
  providers: [NotificacionService],
  controllers: [NotificacionController],
  exports: [NotificacionService],
})
export class NotificacionModule {}
