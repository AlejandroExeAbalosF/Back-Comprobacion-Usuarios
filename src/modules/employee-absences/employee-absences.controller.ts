import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmployeeAbsencesService } from './employee-absences.service';
import { CreateEmployeeAbsenceDto } from './dto/create-employee-absence.dto';
import { UpdateEmployeeAbsenceDto } from './dto/update-employee-absence.dto';

@Controller('employee-absences')
export class EmployeeAbsencesController {
  constructor(private readonly employeeAbsencesService: EmployeeAbsencesService) {}

  @Post()
  create(@Body() createEmployeeAbsenceDto: CreateEmployeeAbsenceDto) {
    return this.employeeAbsencesService.create(createEmployeeAbsenceDto);
  }

  @Get()
  findAll() {
    return this.employeeAbsencesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeAbsencesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployeeAbsenceDto: UpdateEmployeeAbsenceDto) {
    return this.employeeAbsencesService.update(+id, updateEmployeeAbsenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeAbsencesService.remove(+id);
  }
}
