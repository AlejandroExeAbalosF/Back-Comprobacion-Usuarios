import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { UsersService } from 'src/modules/users/users.service';
import { Registration } from 'src/modules/registrations/entities/registration.entity';
import { RegistrationsService } from 'src/modules/registrations/registrations.service';
import { NotificationsModule } from 'src/modules/gateways/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Registration]),
    NotificationsModule,
  ],
  controllers: [SeedController],
  providers: [SeedService, UsersService, RegistrationsService],
})
export class SeedModule {}
