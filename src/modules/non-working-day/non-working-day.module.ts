import { Module } from '@nestjs/common';
import { NonWorkingDayService } from './non-working-day.service';
import { NonWorkingDayController } from './non-working-day.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NonWorkingDay } from './entities/non-working-day.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NonWorkingDay])],
  controllers: [NonWorkingDayController],
  providers: [NonWorkingDayService],
  exports: [NonWorkingDayService],
})
export class NonWorkingDayModule {}
