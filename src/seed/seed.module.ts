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
import { Articulo } from 'src/modules/articulos/entities/articulo.entity';
import { Inciso } from 'src/modules/articulos/entities/inciso.entity';
import { SubInciso } from 'src/modules/articulos/entities/sub-inciso.entity';
import { Shift } from 'src/modules/users/entities/shift.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Shift,
      Registration,
      Ministry,
      Secretariat,
      NonWorkingDay,
      Articulo,
      Inciso,
      SubInciso,
      NonWorkingDay,
    ]),
    NotificationsModule,
  ],
  controllers: [SeedController],
  providers: [SeedService, UsersService, RegistrationsService],
})
export class SeedModule {}
