import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { Registration } from './entities/registration.entity';
import { UsersService } from '../users/users.service';
import dayjs from 'dayjs';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly userService: UsersService,
    private readonly dataSource: DataSource,
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
      throw new NotFoundException(
        `El documento ingresado no existe en la base de datos`,
      );
    }
    //validar la fehca, si no es fin de semana o dias no laborales

    const lastRegistration = await this.registrationRepository
      .createQueryBuilder('registration')
      .where('registration.user = :userId', { userId: dniValidate.id })
      .orderBy('registration.entryDate', 'DESC')
      .getOne();

    if (lastRegistration) {
      const lastRegistrationDate = dayjs(lastRegistration.entryDate);
      // Obtener la fecha actual
      const currentDate = dayjs();
      if (lastRegistrationDate.isSame(currentDate, 'day')) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          await queryRunner.manager.update(
            Registration,
            {
              id: lastRegistration.id,
            },
            {
              validated: false,
              exitDate: currentDate.toDate(),
              exitCapture: file.buffer,
            },
          );
          return {
            message: 'Registrada la Salida Correctamente',
          };
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      }
      // return { lastRegistration };
    }

    console.log('hola');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // let newRegistrationSave: Registration;

      const newRegistration = queryRunner.manager.create(Registration, {
        ...registrationDto,
        entryCapture: file.buffer,
        validated: true,
        entryDate: new Date(),
        user: dniValidate,
      });
      await queryRunner.manager.save(newRegistration);

      await queryRunner.commitTransaction();

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
