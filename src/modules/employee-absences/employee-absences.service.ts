import { Injectable } from '@nestjs/common';
import { CreateEmployeeAbsenceDto } from './dto/create-employee-absence.dto';
import { UpdateEmployeeAbsenceDto } from './dto/update-employee-absence.dto';

@Injectable()
export class EmployeeAbsencesService {
  create(createEmployeeAbsenceDto: CreateEmployeeAbsenceDto) {
    return 'This action adds a new employeeAbsence';
  }

  findAll() {
    return `This action returns all employeeAbsences`;
  }

  findOne(id: number) {
    return `This action returns a #${id} employeeAbsence`;
  }

  update(id: number, updateEmployeeAbsenceDto: UpdateEmployeeAbsenceDto) {
    return `This action updates a #${id} employeeAbsence`;
  }

  remove(id: number) {
    return `This action removes a #${id} employeeAbsence`;
  }
}
