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
import { startOfDay, isSameDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { last } from 'rxjs';
import { validate } from 'class-validator';
import { CreateRegistrationEmpDniDto } from './dto/create-registrationEmpDni.dto';
import { UserWithLastRegistration } from 'src/helpers/types';
import { Secretariat } from '../secretariats/entities/secretariat.entity';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Secretariat)
    private readonly secretariatRepository: Repository<Secretariat>,
    private readonly userService: UsersService,
    private readonly dataSource: DataSource,
    private readonly notificationsGateway: NotificationsGateway,
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

    const dniValidate = await this.userService.searchDni(
      registrationDto.document,
    );
    if (!dniValidate) {
      throw new NotFoundException(`Documento no encontrado`);
    }

    const lastRegistration = await this.registrationRepository
      .createQueryBuilder('registration')
      .where('registration.user = :userId', { userId: dniValidate.id })
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

          const updatedResult = await queryRunner.manager
            .createQueryBuilder()
            .update(Registration)
            .set({
              status: 'PRESENTE',
              exitDate: exitDateUtc,
              exitCapture: file,
            })
            .where({ id: lastRegistration.id })
            .returning(['exitDate', 'exitCapture', 'status'])
            .execute();

          // Actualizamos el objeto manualmente
          // console.log(updatedResult.raw[0]);
          const updatedValues: Pick<
            Registration,
            'exitDate' | 'exitCapture' | 'status'
          > = {
            exitDate: updatedResult.raw[0].exit_date, // Convertimos snake_case a camelCase
            exitCapture: updatedResult.raw[0].exit_capture,
            status: updatedResult.raw[0].status,
          };

          await queryRunner.commitTransaction();

          // Enviar la notificación directamente con `updatedValues`
          this.notificationsGateway.sendNotification({
            id: dniValidate.id,
            idR: lastRegistration.id, // `id` sigue siendo el mismo
            name: dniValidate.name,
            lastName: dniValidate.lastName,
            document: dniValidate.document,
            date: toZonedTime(updatedValues.exitDate as Date, timeZone),
            capture: updatedValues.exitCapture,
            status: updatedValues.status,
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

      const newRegistration = queryRunner.manager.create(Registration, {
        ...registrationDto,
        entryCapture: file,
        status: 'TRABAJANDO',
        entryDate: entryDateUtc,
        user: dniValidate,
      });
      // console.log(newRegistration);
      await queryRunner.manager.save(newRegistration);

      await queryRunner.commitTransaction();

      // Se envía la notificación directamente con los datos que ya tenemos
      this.notificationsGateway.sendNotification({
        id: dniValidate.id,
        idR: newRegistration.id,
        name: dniValidate.name,
        lastName: dniValidate.lastName,
        document: dniValidate.document,
        date: toZonedTime(newRegistration.entryDate as Date, timeZone), // newRegistration.entryDate,
        capture: newRegistration.entryCapture,
        status: newRegistration.status,
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
    const registerFinded = await this.registrationRepository.findOne({
      where: { id: id },
    });

    if (!registerFinded) {
      throw new NotFoundException(`Registro no encontrado`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const updateRegister = queryRunner.manager.preload(Registration, {
        id,
        ...updateRegistrationDto,
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
