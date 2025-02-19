import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../auth/dto/create-auth.dto';
import { CreateUserEmpDto } from './dto/create-userEmp.dto';
import { Ministry } from '../ministries/entities/ministry.entity';
import { Secretariat } from '../secretariats/entities/secretariat.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userService: Repository<User>,
    @InjectRepository(Ministry)
    private readonly ministryRepository: Repository<Ministry>,
    @InjectRepository(Secretariat)
    private readonly secretariatRepository: Repository<Secretariat>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    const users = this.userService.find();

    if (!users) throw new NotFoundException('No se encontraron usuarios');
    return users;
  }

  async getUsersWithLastRegistration() {
    // const users = await this.userService
    //   .createQueryBuilder('user')
    //   .leftJoinAndSelect(
    //     'user.registrations',
    //     'registration',
    //     `registration.id = (
    //   SELECT r.id
    //   FROM registrations r
    //   WHERE r.userId = user.id
    //   ORDER BY r.entry_date DESC
    //   LIMIT 1
    // )`,
    //   )
    //   .where('user.rol = :rol', { rol: 'user' })
    //   .getMany();
    // const users = await this.userService
    //   .createQueryBuilder('user')
    //   .leftJoinAndSelect(
    //     'user.registrations',
    //     'registration',
    //     `registration.id = (
    //       SELECT r.id
    //       FROM registrations r
    //       WHERE r."userId" = user.id
    //       ORDER BY r.entry_date DESC
    //       LIMIT 1
    //     )`,
    //   )
    //   .where('user.rol = :rol', { rol: 'user' })
    //   .getMany();
    const users = await this.userService
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.registrations',
        'registration',
        `registration.id = (
      SELECT r.id 
      FROM registrations r 
      WHERE r."user_id" = user.id 
      ORDER BY r.entry_date DESC 
      LIMIT 1
    )`,
      )
      .leftJoinAndSelect('user.secretariat', 'secretariat')
      .leftJoinAndSelect('secretariat.ministry', 'ministry')
      .where('user.rol = :rol', { rol: 'user' })
      .getMany();

    // const users = await this.userService.query(`
    //     SELECT
    //         u.id AS user_id,
    //         u.password AS user_password,
    //         u.name AS user_name,
    //         u.last_name AS user_last_name,
    //         u.document AS user_document,
    //         u.image AS user_image,
    //         u.phone AS user_phone,
    //         u.cellphone AS user_cellphone,
    //         u.email AS user_email,
    //         u.state AS user_state,
    //         u.rol AS user_rol,
    //         u.created_at AS user_created_at,
    //         r.id AS registration_id,
    //         r.validated AS registration_validated,
    //         r.state AS registration_state,
    //         r.entry_capture AS registration_entry_capture,
    //         r.exit_capture AS registration_exit_capture,
    //         r.entry_date AS registration_entry_date,
    //         r.exit_date AS registration_exit_date,
    //         r.created_at AS registration_created_at
    //     FROM users u
    //     LEFT JOIN registrations r ON r.id = (
    //         SELECT r2.id
    //         FROM registrations r2
    //         WHERE r2."userId" = u.id
    //         ORDER BY r2.entry_date DESC
    //         LIMIT 1
    //     )
    //     WHERE u.rol = 'user';
    // `);
    if (!users) throw new NotFoundException('No se encontraron usuarios ');
    return users;
  }
  async searchDni(dni: number) {
    return await this.userService.findOne({ where: { document: dni } });
  }

  async searchEmail(email: string) {
    return await this.userService.findOne({
      where: { email: email },
      relations: ['secretariat', 'secretariat.ministry'],
    });
  }
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userData = {
      ...CreateUserDto,
      password: hashedPassword,
    };
    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newUserSave = User;
    } catch (error) {}
    return 'This action adds a new user';
  }

  async createEmployee(createUserDto: CreateUserEmpDto, file: string | null) {
    const validatedEmail = await this.searchEmail(createUserDto.email);

    if (validatedEmail)
      throw new BadRequestException(
        'Ya existe un usuario registrado con ese email.',
      );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const secretariatFinded = await this.secretariatRepository.findOneBy({
        id: createUserDto.secretariatId,
      });
      if (!secretariatFinded)
        throw new BadRequestException('No se encontro la secretaria');
      const newUser = queryRunner.manager.create(User, {
        ...createUserDto,
        image: file
          ? file
          : 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        secretariat: secretariatFinded,
      });
      await queryRunner.manager.save(newUser);
      await queryRunner.commitTransaction();
      return { message: 'Empleado creado exitosamente', user: newUser };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    file: string | null,
  ) {
    const userExists = await this.userService.findOne({ where: { id: id } });
    if (!userExists) throw new NotFoundException('No se encuentra el usuario');

    if (updateUserDto?.document) {
      const dniExists = await this.userService.findOneBy({
        document: updateUserDto.document,
      });
      if (dniExists && userExists.document !== updateUserDto.document)
        throw new BadRequestException('Ya existe un usuario con ese DNI');
    }

    if (userExists.rol === 'superadmin')
      throw new UnauthorizedException('No se puede modificar ese usuario');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const secretariatFinded = await this.secretariatRepository.findOneBy({
        id: updateUserDto.secretariatId,
      });
      if (!secretariatFinded)
        throw new BadRequestException('No se encontró la secretaría');
      // Extraer secretariatId para evitar pasarlo en el spread
      const { secretariatId, ...userData } = updateUserDto;

      const user = await queryRunner.manager.preload(User, {
        id,
        ...updateUserDto,
        image: file ? file : userExists.image,
        secretariat: secretariatFinded,
      });
      // Guardar los cambios (una sola llamada a save es suficiente)
      const userModified = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      return {
        message: `Usuario actualizado correctamente`,
        user: userModified,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
