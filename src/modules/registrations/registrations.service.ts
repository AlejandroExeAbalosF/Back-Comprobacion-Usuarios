import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { Registration } from './entities/registration.entity';
import { UsersService } from '../users/users.service';
import * as dayjs from 'dayjs';
import {
  startOfDay,
  isSameDay,
  format,
  addMinutes,
  isBefore,
  setHours,
  setMinutes,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { last } from 'rxjs';
import { validate } from 'class-validator';
import { CreateRegistrationEmpDniDto } from './dto/create-registrationEmpDni.dto';
import { UserWithLastRegistration } from 'src/helpers/types';
import { Secretariat } from '../secretariats/entities/secretariat.entity';
import { Shift } from '../users/entities/shift.entity';
import { NonWorkingDayService } from '../non-working-day/non-working-day.service';

const toleranceMinutes = 10;

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(Secretariat)
    private readonly secretariatRepository: Repository<Secretariat>,
    private readonly userService: UsersService,
    private readonly dataSource: DataSource,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly nonWorkingDayService: NonWorkingDayService,
  ) {}

  create(createRegistrationDto: CreateRegistrationDto) {
    return 'This action adds a new registration';
  }

  async getRegistrationsByUserId(userId: string): Promise<Registration[]> {
    const registrations = await this.registrationRepository.find({
      where: { user: { id: userId } },
      order: { entryDate: 'DESC' }, // Ordena por entryDate de más reciente a más antiguo
      relations: ['user'], // Incluye la relación con el usuario si es necesario
    });
    if (!registrations) {
      throw new NotFoundException(`No se encontraron registros`);
    }
    // console.log(registrations);
    return registrations;
    // return this.registrationRepository.find({
    //   where: { user: { id: userId } },
    //   order: { entryDate: 'DESC' }, // Ordena por entryDate de más reciente a más antiguo
    //   relations: ['user'], // Incluye la relación con el usuario si es necesario
    // });
  }

  async registrationsByUser(
    registrationDto: CreateRegistrationEmpDniDto,
    file: string | null,
  ) {
    const timeZone = 'America/Argentina/Buenos_Aires';
    const currentDate = toZonedTime(new Date(), timeZone); // Convertimos la fecha actual a Argentina
    const entryTime = toZonedTime(new Date(), timeZone);

    const userValidate = await this.userService.searchDni(
      registrationDto.document,
    );
    if (!userValidate) {
      throw new NotFoundException(`Documento no encontrado`);
    }

    // 📌 1. Obtener turno del usuario
    // const userShift = await this.shiftRepository.findOne({
    //   where: { id: userValidate.shift.id },
    // });
    // if (!userShift) {
    //   throw new NotFoundException(`Turno no encontrado para el usuario`);
    // }

    const shiftEntryHour = userValidate.entryHour
      ? userValidate.entryHour
      : userValidate.shift.entryHour; // Hora de entrada del turno (HH:mm:ss)
    const shiftExitHour = userValidate.exitHour
      ? userValidate.exitHour
      : userValidate.shift.exitHour; // Hora de salida del turno (HH:mm:ss)

    const lastRegistration = await this.registrationRepository
      .createQueryBuilder('registration')
      .where('registration.user = :userId', { userId: userValidate.id })
      .orderBy('registration.entryDate', 'DESC')
      .getOne();

    if (lastRegistration) {
      const lastRegistrationDate = toZonedTime(
        lastRegistration.entryDate as Date,
        timeZone,
      );

      if (
        isSameDay(startOfDay(lastRegistrationDate), startOfDay(currentDate))
      ) {
        if (['present', 'absent'].includes(lastRegistration.status)) {
          throw new BadRequestException(
            'Ya se ha registrado la Salida o está registrado como Ausente.',
          );
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          const exitDateUtc = toZonedTime(currentDate, timeZone); // Convertimos a UTC antes de guardar

          // 📌 2. Validar salida temprana
          // Parseamos la hora de entrada "HH:mm" a un objeto Date
          const [hours, minutes] = shiftExitHour.split(':');
          entryTime.setHours(Number(hours), Number(minutes), 0); // Establecemos la hora de entrada

          // Formateamos las fechas para comparación (opcional)
          const formattedEntryTimeWithTolerance = format(entryTime, 'HH:mm');
          const currentTime = format(currentDate, 'HH:mm');

          // Comparación
          console.log('Hora de Salida:', formattedEntryTimeWithTolerance);
          console.log('Hora actual:', currentTime);
          const isEarly = isBefore(currentDate, entryTime); // Comparamos la hora de entrada con la hora actual
          if (isEarly) {
            console.log('Salida temprana');
          } else {
            console.log('Salida dentro del horario');
          }
          const updatedResult = await queryRunner.manager
            .createQueryBuilder()
            .update(Registration)
            .set({
              status: 'PRESENTE',
              exitDate: exitDateUtc,
              exitCapture: file,
              type: isEarly
                ? lastRegistration.type
                  ? lastRegistration.type + '-SALIDA_TEMPRANA'
                  : 'SALIDA_TEMPRANA'
                : lastRegistration.type,
            })
            .where({ id: lastRegistration.id })
            .returning(['exitDate', 'exitCapture', 'status', 'type'])
            .execute();

          // Actualizamos el objeto manualmente
          // console.log(updatedResult.raw[0]);
          const updatedValues: Pick<
            Registration,
            'exitDate' | 'exitCapture' | 'status' | 'type'
          > = {
            exitDate: updatedResult.raw[0].exit_date, // Convertimos snake_case a camelCase
            exitCapture: updatedResult.raw[0].exit_capture,
            status: updatedResult.raw[0].status,
            type: updatedResult.raw[0].type,
          };

          await queryRunner.commitTransaction();

          // Enviar la notificación directamente con `updatedValues`
          this.notificationsGateway.sendNotification({
            id: userValidate.id,
            idR: lastRegistration.id, // `id` sigue siendo el mismo
            name: userValidate.name,
            lastName: userValidate.lastName,
            document: userValidate.document,
            date: toZonedTime(updatedValues.exitDate as Date, timeZone),
            capture: updatedValues.exitCapture,
            status: updatedValues.status,
            type: updatedValues.type,
          });

          return { message: 'Registrada la Salida Correctamente' };
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      }
    }

    // Creación de nuevo registro sin consultas extra
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entryDateUtc = fromZonedTime(currentDate, timeZone); // Convertimos a UTC antes de guardar
      // Parseamos la hora de entrada "HH:mm" a un objeto Date
      const [hours, minutes] = shiftEntryHour.split(':');
      entryTime.setHours(Number(hours), Number(minutes), 0); // Establecemos la hora de entrada
      // Agregamos 10 minutos de tolerancia
      const entryTimeWithTolerance = addMinutes(entryTime, toleranceMinutes);

      // Formateamos las fechas para comparación (opcional)
      // const formattedEntryTimeWithTolerance = format(
      //   entryTimeWithTolerance,
      //   'HH:mm',
      // );
      // const currentTime = format(currentDate, 'HH:mm');

      // Comparación
      // console.log(
      //   'Hora de entrada con tolerancia:',
      //   formattedEntryTimeWithTolerance,
      // );
      // console.log('Hora actual:', currentTime);

      // Verificar si la hora actual está dentro de los 10 minutos de tolerancia
      const isLate = isBefore(currentDate, entryTimeWithTolerance);
      // if (isLate) {
      //   console.log('La entrada está dentro de la tolerancia.');
      // } else {
      //   console.log('La entrada está tarde.');
      // }
      entryTime.setHours(Number(hours), Number(minutes), 0);
      const newRegistration = queryRunner.manager.create(Registration, {
        entryCapture: file,
        status: 'TRABAJANDO',
        entryDate: entryDateUtc,
        user: userValidate,
        type: !isLate ? 'LLEGADA_TARDE' : null,
      });
      // console.log(newRegistration);
      await queryRunner.manager.save(newRegistration);

      await queryRunner.commitTransaction();

      // Se envía la notificación directamente con los datos que ya tenemos
      this.notificationsGateway.sendNotification({
        id: userValidate.id,
        idR: newRegistration.id,
        name: userValidate.name,
        lastName: userValidate.lastName,
        document: userValidate.document,
        date: toZonedTime(newRegistration.entryDate as Date, timeZone), // newRegistration.entryDate,
        capture: newRegistration.entryCapture,
        status: newRegistration.status,
        type: newRegistration.type,
      });
      console.log('horaUTC', newRegistration.entryDate);
      console.log(
        'horaLocal',
        toZonedTime(newRegistration.entryDate as Date, timeZone),
      );

      return { message: 'Registrada la Entrada Correctamente' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // async registrationsExit(){

  // }

  async validationsRegistrationsToday(secretariat: string) {
    // console.log('secretariat', secretariat.secretariatName);
    const secretariatFinded = await this.secretariatRepository.findOneBy({
      name: secretariat,
    });
    if (!secretariatFinded)
      throw new NotFoundException(`Secretaria no encontrada`);
    const usersRegisters = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.registrations',
        'registration',
        `registration.id = (
        SELECT r.id FROM registrations r
        WHERE r."user_id" = "user"."id"
        ORDER BY r."entry_date" DESC
        LIMIT 1
      )`,
      )
      .where('user.secretariat_id = :secretariat', {
        secretariat: secretariatFinded.id,
      })
      .andWhere('user.state = :state', { state: true })
      .andWhere('user.rol = :rol', { rol: 'user' })
      .getMany();

    // console.log(usersRegisters);
    if (usersRegisters.length === 0)
      throw new NotFoundException(`No se encontraron registros`);
    // console.log(usersRegisters);
    const currentDate = new Date();

    for (const user of usersRegisters) {
      const validateNonWorkingDay =
        await this.nonWorkingDayService.isTodayNonWorkingDay(currentDate);
      console.log('validateNonWorkingDay', validateNonWorkingDay);
      if (user.registrations.length > 0) {
        const lastRegistrationDate = dayjs(user.registrations[0].entryDate);

        //el ultimo registro se realizao el dia de hoy?
        if (lastRegistrationDate.isSame(currentDate, 'day')) {
          // console.log(
          //   'aver true',
          //   lastRegistrationDate.isSame(currentDate, 'day'),
          // );
        } else {
          // Creación de nuevo registro de ausencia
          const queryRunner = this.dataSource.createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          console.log('fecha actual ', currentDate);

          try {
            const newRegistration = queryRunner.manager.create(Registration, {
              status:
                validateNonWorkingDay.length > 0 ? 'NO_LABORABLE' : 'AUSENTE',
              entryDate: currentDate,
              user: user,
              type: validateNonWorkingDay.length > 0 ? validateNonWorkingDay[0].type : null,
              description: validateNonWorkingDay.length > 0 ? validateNonWorkingDay[0].description : null,
            });
            // console.log(newRegistration);
            await queryRunner.manager.save(newRegistration);

            await queryRunner.commitTransaction();

            // Se envía la notificación directamente con los datos que ya tenemos
            this.notificationsGateway.sendNotification({
              id: user.id,
              idR: newRegistration.id,
              name: user.name,
              lastName: user.lastName,
              document: user.document,
              date: newRegistration.entryDate,
              capture: newRegistration.entryCapture,
              status: newRegistration.status,
            });
            console.log('se crea el registro de ausencia');
            // console.log('aver nuevo register', newRegistration);
          } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
          } finally {
            await queryRunner.release();
          }
        }
      } else {
        // Creación de nuevo registro de ausencia
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
          const newRegistration = queryRunner.manager.create(Registration, {
            status:
              validateNonWorkingDay.length > 0 ? 'NO_LABORABLE' : 'AUSENTE',
            entryDate: currentDate,
            user: user,
            type: validateNonWorkingDay.length > 0 ? validateNonWorkingDay[0].type : null,
              description: validateNonWorkingDay.length > 0 ? validateNonWorkingDay[0].description : null,
          });
          // console.log(newRegistration);
          await queryRunner.manager.save(newRegistration);

          await queryRunner.commitTransaction();

          // Se envía la notificación directamente con los datos que ya tenemos
          this.notificationsGateway.sendNotification({
            id: user.id,
            idR: newRegistration.id,
            name: user.name,
            lastName: user.lastName,
            document: user.document,
            date: newRegistration.entryDate,
            capture: newRegistration.entryCapture,
            status: newRegistration.status,
          });
          // console.log('aver nuevo register', newRegistration);
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      }
    }
    return { message: 'Validacion de Ausencia Exitosa' };
  }

  async validationsRegistrations() {
    const usersRegisters = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.registrations',
        'registration',
        `registration.id = (
        SELECT r.id FROM registrations r
        WHERE r."userId" = "user"."id"
        ORDER BY r."entry_date" DESC
        LIMIT 1
      )`,
      )
      .where('user.state = :state', { state: true })
      .andWhere('user.rol = :rol', { rol: 'user' })
      .getMany();

    if (usersRegisters.length === 0) console.log(`No se encontraron registros`);

    for (const user of usersRegisters) {
      if (user.registrations.length > 0) {
        const lastRegistrationDate = dayjs(user.registrations[0].entryDate);
        const currentDate = dayjs();
        //el ultimo registro se realizao el dia de hoy?
        if (lastRegistrationDate.isSame(currentDate, 'day')) {
          // console.log(
          //   'aver true',
          //   lastRegistrationDate.isSame(currentDate, 'day'),
          // );
        } else {
          // Creación de nuevo registro de ausencia
          const queryRunner = this.dataSource.createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          console.log('fecha actual ', currentDate.toDate());
          try {
            const newRegistration = queryRunner.manager.create(Registration, {
              status: 'AUSENTE',
              entryDate: currentDate.toDate(),
              user: user,
            });
            // console.log(newRegistration);
            await queryRunner.manager.save(newRegistration);

            await queryRunner.commitTransaction();

            // Se envía la notificación directamente con los datos que ya tenemos
            this.notificationsGateway.sendNotification({
              id: user.id,
              idR: newRegistration.id,
              name: user.name,
              lastName: user.lastName,
              document: user.document,
              date: newRegistration.entryDate,
              capture: newRegistration.entryCapture,
              status: newRegistration.status,
            });
            // console.log('aver nuevo register', newRegistration);
          } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
          } finally {
            await queryRunner.release();
          }
        }
      } else {
        const currentDate = dayjs();
        // Creación de nuevo registro de ausencia
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
          const newRegistration = queryRunner.manager.create(Registration, {
            status: 'AUSENTE',
            entryDate: currentDate.toDate(),
            user: user,
          });
          // console.log(newRegistration);
          await queryRunner.manager.save(newRegistration);

          await queryRunner.commitTransaction();

          // Se envía la notificación directamente con los datos que ya tenemos
          this.notificationsGateway.sendNotification({
            id: user.id,
            idR: newRegistration.id,
            name: user.name,
            lastName: user.lastName,
            document: user.document,
            date: newRegistration.entryDate,
            capture: newRegistration.entryCapture,
            status: newRegistration.status,
          });
          // console.log('aver nuevo register', newRegistration);
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      }
    }
    return { msg: 'Validacion Completa' };
    // console.log(usersRegisters);
  }

  remove(id: number) {
    return `This action removes a #${id} registration`;
  }
  async updateRegister(
    id: string,
    updateRegistrationDto: UpdateRegistrationDto,
  ) {
    const timeZone = 'America/Argentina/Buenos_Aires';
    const registerFinded = await this.registrationRepository.findOne({
      where: { id: id },
    });

    if (!registerFinded) {
      throw new NotFoundException(`Registro no encontrado`);
    }
    console.log('updateRegistrationDto', updateRegistrationDto);
    const dateUpdated: { entryDate?: Date; exitDate?: Date } = {};
    if (updateRegistrationDto.entryHour) {
      // Descomponer la hora (hh:mm)
      const [hours, minutes] = updateRegistrationDto.entryHour
        .split(':')
        .map(Number);

      // Actualizar la hora y los minutos en la fecha UTC
      const updatedDate = setHours(registerFinded.entryDate as Date, hours); // Establecer la hora
      const updatedDateWithMinutes = setMinutes(updatedDate, minutes); // Establecer los minutos
      // Aquí actualizamos la propiedad entryDate de dateUpdated
      dateUpdated.entryDate = updatedDateWithMinutes;
    }
    if (updateRegistrationDto.exitHour) {
      const [hours, minutes] = updateRegistrationDto.exitHour
        .split(':')
        .map(Number);
      // Actualizar la hora y los minutos en la fecha UTC
      const updatedDate = setHours(
        registerFinded.exitDate
          ? registerFinded.exitDate
          : (registerFinded.entryDate as Date),
        hours,
      ); // Establecer la hora
      const updatedDateWithMinutes = setMinutes(updatedDate, minutes); // Establecer los minutos
      // Aquí actualizamos la propiedad entryDate de dateUpdated
      dateUpdated.exitDate = updatedDateWithMinutes;
    }
    console.log('entryDate', registerFinded.entryDate);
    console.log('updatedDateWithMinutes', dateUpdated);
    const { entryHour, exitHour } = updateRegistrationDto;
    // const entryHornUpdateDate = updateRegistrationDto.entryHour ?
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const updateRegister = await queryRunner.manager.preload(Registration, {
        id,
        ...updateRegistrationDto,
        entryDate: dateUpdated.entryDate
          ? dateUpdated.entryDate
          : registerFinded.entryDate,
        exitDate: dateUpdated.exitDate
          ? dateUpdated.exitDate
          : registerFinded.exitDate,
      });
      const registerModified = await queryRunner.manager.save(updateRegister);
      await queryRunner.commitTransaction();
      return {
        message: 'Registro modificado exitosamente',
        register: registerModified,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
