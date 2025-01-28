import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { UsersService } from 'src/modules/users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [SeedController],
  providers: [SeedService, UsersService],
})
export class SeedModule {}
