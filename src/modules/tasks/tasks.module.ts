import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { RegistrationsService } from '../registrations/registrations.service';
import { RegistrationsModule } from '../registrations/registrations.module';

@Module({
  imports: [ScheduleModule.forRoot(), RegistrationsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
