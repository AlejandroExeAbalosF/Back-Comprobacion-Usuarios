import { Module } from '@nestjs/common';
import { EmployeeAbsencesService } from './employee-absences.service';
import { EmployeeAbsencesController } from './employee-absences.controller';

@Module({
  controllers: [EmployeeAbsencesController],
  providers: [EmployeeAbsencesService],
})
export class EmployeeAbsencesModule {}
