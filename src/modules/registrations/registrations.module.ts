import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Registration } from './entities/registration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Registration, User])],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, UsersService],
})
export class RegistrationsModule {}
