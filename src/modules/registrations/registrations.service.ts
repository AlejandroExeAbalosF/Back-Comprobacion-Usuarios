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
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { last } from 'rxjs';
import { validate } from 'class-validator';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
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
    registrationDto: CreateRegistrationDto,
    file: string | null,
  ) {
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
      const lastRegistrationDate = dayjs(lastRegistration.entryDate);
      const currentDate = dayjs();

      if (lastRegistrationDate.isSame(currentDate, 'day')) {
        if (lastRegistration.validated === 'idle') {
          throw new BadRequestException('Ya se ha registrado la Salida');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          const updatedResult = await queryRunner.manager
            .createQueryBuilder()
            .update(Registration)
            .set({
              validated: 'idle',
              exitDate: currentDate.toDate(),
              exitCapture: file,
            })
            .where({ id: lastRegistration.id })
            .returning(['exitDate', 'exitCapture', 'validated'])
            .execute();

          // Actualizamos el objeto manualmente
          const updatedValues: Pick<
            Registration,
            'exitDate' | 'exitCapture' | 'validated'
          > = {
            exitDate: updatedResult.raw[0].exit_date, // Convertimos snake_case a camelCase
            exitCapture: updatedResult.raw[0].exit_capture,
            validated: updatedResult.raw[0].validated,
          };

          await queryRunner.commitTransaction();

          // Enviar la notificación directamente con `updatedValues`
          this.notificationsGateway.sendNotification({
            id: dniValidate.id,
            idR: lastRegistration.id, // `id` sigue siendo el mismo
            name: dniValidate.name,
            lastName: dniValidate.lastName,
            document: dniValidate.document,
            date: updatedValues.exitDate,
            capture: updatedValues.exitCapture,
            validated: updatedValues.validated,
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
      const newRegistration = queryRunner.manager.create(Registration, {
        ...registrationDto,
        entryCapture: file,
        validated: 'present',
        entryDate: new Date(),
        user: dniValidate,
      });

      await queryRunner.manager.save(newRegistration);

      await queryRunner.commitTransaction();

      // Se envía la notificación directamente con los datos que ya tenemos
      this.notificationsGateway.sendNotification({
        id: dniValidate.id,
        idR: newRegistration.id,
        name: dniValidate.name,
        lastName: dniValidate.lastName,
        document: dniValidate.document,
        date: newRegistration.entryDate,
        capture: newRegistration.entryCapture,
        validated: newRegistration.validated,
      });

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
  update(id: number, updateRegistrationDto: UpdateRegistrationDto) {
    return `This action updates a #${id} registration`;
  }

  remove(id: number) {
    return `This action removes a #${id} registration`;
  }
}
