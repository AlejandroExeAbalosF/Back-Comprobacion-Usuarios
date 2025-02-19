import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Registration } from './entities/registration.entity';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { UsersModule } from '../users/users.module';
import { Secretariat } from '../secretariats/entities/secretariat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, User, Secretariat]),
    UsersModule,
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, UsersService, NotificationsGateway],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
