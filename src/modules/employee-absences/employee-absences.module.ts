import { Module } from '@nestjs/common';
import { EmployeeAbsencesService } from './employee-absences.service';
import { EmployeeAbsencesController } from './employee-absences.controller';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeAbsence } from './entities/employee-absence.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeAbsence, User])],
  controllers: [EmployeeAbsencesController],
  providers: [EmployeeAbsencesService],
  exports: [EmployeeAbsencesService],
})
export class EmployeeAbsencesModule {}
