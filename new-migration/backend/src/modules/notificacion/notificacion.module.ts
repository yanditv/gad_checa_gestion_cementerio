import { Module } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { NotificacionController } from './notificacion.controller';
import { NotificacionJob } from './notificacion.job';

@Module({
  providers: [NotificacionService, NotificacionJob],
  controllers: [NotificacionController],
  exports: [NotificacionService],
})
export class NotificacionModule {}
