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

  findAll() {
    return `This action returns all registrations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} registration`;
  }

  async registrationsByUser(
    registrationDto: CreateRegistrationDto,
    file: Express.Multer.File,
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
        if (lastRegistration.validated === false) {
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
              validated: false,
              exitDate: currentDate.toDate(),
              exitCapture: file.buffer,
            })
            .where({ id: lastRegistration.id })
            .returning(['exitDate', 'exitCapture', 'validated'])
            .execute();

          // Actualizamos el objeto manualmente
          const updatedValues = (
            updatedResult.raw as Pick<
              Registration,
              'exitDate' | 'exitCapture' | 'validated'
            >[]
          )[0];

          await queryRunner.commitTransaction();

          // Enviar la notificación directamente con `updatedValues`
          this.notificationsGateway.sendNotification({
            idR: lastRegistration.id, // `id` sigue siendo el mismo
            name: dniValidate.name,
            lastName: dniValidate.lastName,
            document: dniValidate.document,
            exitDate: updatedValues.exitDate,
            exitCapture: updatedValues.exitCapture,
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
        entryCapture: file.buffer,
        validated: true,
        entryDate: new Date(),
        user: dniValidate,
      });

      await queryRunner.manager.save(newRegistration);

      await queryRunner.commitTransaction();

      // Se envía la notificación directamente con los datos que ya tenemos
      this.notificationsGateway.sendNotification({
        idR: newRegistration.id,
        name: dniValidate.name,
        lastName: dniValidate.lastName,
        document: dniValidate.document,
        entryDate: newRegistration.entryDate,
        entryCapture: newRegistration.entryCapture,
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
