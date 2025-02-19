import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Ministry } from '../ministries/entities/ministry.entity';
import { Secretariat } from '../secretariats/entities/secretariat.entity';
import { MinistriesModule } from '../ministries/ministries.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Ministry, Secretariat]),
    MinistriesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], // Exportas TypeOrmModule para que los repositorios sean visibles
})
export class UsersModule {}
