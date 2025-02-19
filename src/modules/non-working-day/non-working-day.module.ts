import { Module } from '@nestjs/common';
import { NonWorkingDayService } from './non-working-day.service';
import { NonWorkingDayController } from './non-working-day.controller';

@Module({
  controllers: [NonWorkingDayController],
  providers: [NonWorkingDayService],
})
export class NonWorkingDayModule {}
