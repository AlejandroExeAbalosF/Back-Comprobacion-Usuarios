import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { EmployeeAbsencesService } from './employee-absences.service';
import { CreateEmployeeAbsenceDto } from './dto/create-employee-absence.dto';
import { UpdateEmployeeAbsenceDto } from './dto/update-employee-absence.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('employee-absences')
export class EmployeeAbsencesController {
  constructor(
    private readonly employeeAbsencesService: EmployeeAbsencesService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('user/:id')
  create(
    @Param('id') id: string,
    @Body() createEmployeeAbsenceDto: CreateEmployeeAbsenceDto,
  ) {
    // return { id, ...createEmployeeAbsenceDto };
    return this.employeeAbsencesService.create(id, createEmployeeAbsenceDto);
  }

  @Get('user/:id')
  findAllByUser(@Param('id') id: string) {
    console.log('id', id);
    return this.employeeAbsencesService.findAllByUser(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeAbsencesService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeAbsenceDto: UpdateEmployeeAbsenceDto,
  ) {
    return this.employeeAbsencesService.update(+id, updateEmployeeAbsenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeAbsencesService.remove(+id);
  }
}
