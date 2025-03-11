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
import { Shift } from '../users/entities/shift.entity';
import { NonWorkingDayModule } from '../non-working-day/non-working-day.module';
import { EmployeeAbsencesModule } from '../employee-absences/employee-absences.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, User, Shift, Secretariat]),
    UsersModule,
    NonWorkingDayModule,
    EmployeeAbsencesModule,
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, UsersService, NotificationsGateway],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
