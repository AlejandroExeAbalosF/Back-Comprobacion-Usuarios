import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { UsersService } from 'src/modules/users/users.service';
import { Registration } from 'src/modules/registrations/entities/registration.entity';
import { RegistrationsService } from 'src/modules/registrations/registrations.service';
import { NotificationsModule } from 'src/modules/gateways/notifications.module';
import { Ministry } from 'src/modules/ministries/entities/ministry.entity';
import { Secretariat } from 'src/modules/secretariats/entities/secretariat.entity';
import { NonWorkingDay } from 'src/modules/non-working-day/entities/non-working-day.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Registration,
      Ministry,
      Secretariat,
      NonWorkingDay,
    ]),
    NotificationsModule,
  ],
  controllers: [SeedController],
  providers: [SeedService, UsersService, RegistrationsService],
})
export class SeedModule {}
