import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNonWorkingDayDto } from './dto/create-non-working-day.dto';
import { UpdateNonWorkingDayDto } from './dto/update-non-working-day.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NonWorkingDay } from './entities/non-working-day.entity';
import { DataSource, Repository } from 'typeorm';
import {
  isWithinInterval,
  parseISO,
  format,
  isEqual,
  parse,
  isSameDay,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class NonWorkingDayService {
  constructor(
    @InjectRepository(NonWorkingDay)
    private readonly nonWorkingDayRepository: Repository<NonWorkingDay>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createNonWorkingDayDto: CreateNonWorkingDayDto) {
    const timeZone = 'America/Argentina/Buenos_Aires';
    console.log('createNonWorkingDayDto', createNonWorkingDayDto.startDate);
    // const startDate = toZonedTime(
    //   new Date(createNonWorkingDayDto.startDate),
    //   timeZone,
    // );
    // console.log(startDate);
    // const endDate = toZonedTime(
    //   new Date(createNonWorkingDayDto.endDate),
    //   timeZone,
    // );
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newNonWorkingDay = queryRunner.manager.create(NonWorkingDay, {
        ...createNonWorkingDayDto,
        // startDate,
        // endDate,
      });
      await queryRunner.manager.save(newNonWorkingDay);
      await queryRunner.commitTransaction();
      console.log('createNonWorkingDayDto', newNonWorkingDay);
      return {
        message: 'Fechas no laborables creadas con éxito',
        data: {
          ...newNonWorkingDay,
          startDate: toZonedTime(newNonWorkingDay.startDate, timeZone),
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    const nonWorkingDays = await this.nonWorkingDayRepository.find();
    if (!nonWorkingDays)
      throw new NotFoundException('No se encontraron Fechas no laborables');
    return nonWorkingDays;
  }

  findOne(id: number) {
    return `This action returns a #${id} nonWorkingDay`;
  }

  async update(id: string, updateNonWorkingDayDto: UpdateNonWorkingDayDto) {
    const nonWorkingDayFinded = await this.nonWorkingDayRepository.findOne({
      where: { id: id },
    });
    if (!nonWorkingDayFinded)
      throw new NotFoundException('No se encontro la fecha');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const nonWorkingDay = await queryRunner.manager.preload(NonWorkingDay, {
        id,
        ...updateNonWorkingDayDto,
      });
      const userModified = await queryRunner.manager.save(nonWorkingDay);
      await queryRunner.commitTransaction();

      return {
        message: 'Fechas no laborables actualizadas con éxito',
        data: userModified,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // async isTodayNonWorkingDay(currentDate: Date) {
  //   const today = currentDate; // Usar la fecha que pasas como argumento
  //   const todayMonthDay = format(today, 'MM-dd'); // Formato MM-dd (mes-día) para feriados fijos
  //   const currentYear = today.getFullYear();

  //   const nonWorkingDays = await this.nonWorkingDayRepository.find();

  //   return nonWorkingDays.some((day) => {
  //     const sd =
  //       day.startDate instanceof Date ? day.startDate : new Date(day.startDate);
  //     console.log('startDate convertido:', sd.toISOString());
  //     const startDate = parseISO(sd.toISOString());
  //     const ed =
  //       day.endDate instanceof Date ? day.endDate : new Date(day.endDate);
  //     const endDate = parseISO(ed.toISOString());

  //     if (day.type === 'FERIADO_FIJO') {
  //       // Comparar solo MM-dd
  //       return (
  //         format(startDate, 'MM-dd') === todayMonthDay &&
  //         (!day.year || day.year === currentYear)
  //       );
  //     }

  //     // Comparar rango de fechas para feriados móviles y otros
  //     return isWithinInterval(today, { start: startDate, end: endDate });
  //   });
  // }

  async isTodayNonWorkingDay(currentDate: Date) {
    const timeZone = 'America/Argentina/Buenos_Aires';
    const today = currentDate; // Ignorar la hora (00:00:00.000)
    console.log('today', today);
const todayDate = currentDate.toISOString().split('T')[0]; // Obtiene solo la parte de la fecha
console.log('todayDate', todayDate);
// if (todayDate >= startDate && todayDate <= endDate) {
//   console.log('La fecha actual está dentro del rango');
// } else {
//   console.log('La fecha actual está fuera del rango');
    // Obtener todos los días no laborables
    const nonWorkingDays = await this.nonWorkingDayRepository.find();

    // Filtrar los días no laborables que coincidan con la fecha actual
    const matchingDays = nonWorkingDays.filter((day) => {
      // Convertir startDate y endDate a objetos Date y ignorar la hora
      // const startDate = day.startDate.toISOString();
      // const endDate = day.endDate.toISOString();
      // console.log('startDate', startDate);
      // if (todayDate >= startDate && todayDate <= endDate) {
      //   return true;
      // } else {
      //   return false;
      // }
      
      return true
      // console.log('day', day);
      // const startDate = toZonedTime(
      //   day.startDate instanceof Date ? day.startDate : new Date(day.startDate),
      //   timeZone,
      // );
      // const endDate = toZonedTime(
      //   day.endDate instanceof Date ? day.endDate : new Date(day.endDate),
      //   timeZone,
      // );
      // if (day.type === 'FERIADO_FIJO') {
      //   // Si es feriado fijo, comparar solo el día y el mes
      //   const fixedHolidayDateStart = new Date(
      //     today.getFullYear(),
      //     startDate.getMonth(),
      //     startDate.getDate(),
      //   );
      //   const fixedHolidayDateEnd = new Date(
      //     today.getFullYear(),
      //     startDate.getMonth(),
      //     startDate.getDate(),
      //   );
      //   console.log('fixedHolidayDateStart', fixedHolidayDateStart);
      //   console.log('fixedHolidayDateEnd', fixedHolidayDateEnd);
      //   console.log(isSameDay(fixedHolidayDateStart, today));
      //   return isWithinInterval(today, {
      //     start: fixedHolidayDateStart,
      //     end: fixedHolidayDateEnd,
      //   });
      // } else {
      //   console.log('startDate', startDate, 'endDate', endDate);
      //   console.log(
      //     isWithinInterval(today, { start: startDate, end: endDate }),
      //   );
      //   console.log(isSameDay(today, startDate));
      //   console.log(isSameDay(today, endDate));
      //   // Si no es feriado fijo, verificar si la fecha actual está dentro del rango
      //   return (
      //     isWithinInterval(today, { start: startDate, end: endDate }) ||
      //     isSameDay(today, startDate) ||
      //     isSameDay(today, endDate)
      //   );
      // }
    });

    return matchingDays; // Devolver todos los registros que coinciden con la fecha actual
  }
  
  remove(id: number) {
    return `This action removes a #${id} nonWorkingDay`;
  }
}
