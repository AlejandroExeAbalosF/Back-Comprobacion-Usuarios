import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  providers: [NotificationsGateway], // Registramos el Gateway como provider
  exports: [NotificationsGateway], // Lo exportamos para poder usarlo en otros módulos
})
export class NotificationsModule {}
