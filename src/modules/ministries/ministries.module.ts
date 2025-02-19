import { Module } from '@nestjs/common';
import { MinistriesService } from './ministries.service';
import { MinistriesController } from './ministries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ministry } from './entities/ministry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ministry])],
  controllers: [MinistriesController],
  providers: [MinistriesService],
})
export class MinistriesModule {}
