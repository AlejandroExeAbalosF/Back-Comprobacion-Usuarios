import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeAbsenceDto } from './dto/create-employee-absence.dto';
import { UpdateEmployeeAbsenceDto } from './dto/update-employee-absence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeAbsence } from './entities/employee-absence.entity';
import {
  DataSource,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { format } from 'date-fns';

@Injectable()
export class EmployeeAbsencesService {
  constructor(
    @InjectRepository(EmployeeAbsence)
    private employeeAbsenceRepository: Repository<EmployeeAbsence>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}
  async create(id: string, createEmployeeAbsenceDto: CreateEmployeeAbsenceDto) {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) throw new NotFoundException('No se encontro el usuario');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newEmployeeAbsence = queryRunner.manager.create(EmployeeAbsence, {
        ...createEmployeeAbsenceDto,
        user: user,
      });
      await queryRunner.manager.save(newEmployeeAbsence);
      await queryRunner.commitTransaction();
      return {
        message: 'Registro de ausencia de empleado creado con exito',
        data: newEmployeeAbsence,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return 'This action adds a new employeeAbsence';
  }

  async findAllByUser(id: string) {
    const user = await this.userRepository.findOneBy({
      id: id,
    });
    console.log('user', user);
    if (!user) throw new NotFoundException('No se encontro el usuario');
    const employeeAbsences = await this.employeeAbsenceRepository.find({
      where: { user: { id: id } },
    });
    console.log('employeeAbsences', employeeAbsences);
    if (!employeeAbsences)
      throw new NotFoundException('No se encontraron registros');
    return employeeAbsences;
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

  async isTodayEmployeeAbsence(currentDate: Date, user: User) {
    const todayMonthDay = format(currentDate, 'MM-dd'); // MM-DD para feriados fijos
    // console.log('todayMonthDay', todayMonthDay);
    const nonWorkingDays = await this.employeeAbsenceRepository.find({
      where: [
        // 1. Días no laborables con rango de fechas
        {
          user: { id: user.id },
          startDate: LessThanOrEqual(currentDate),
          endDate: MoreThanOrEqual(currentDate),
        },
      ],
    });

    return nonWorkingDays;
  }
}
