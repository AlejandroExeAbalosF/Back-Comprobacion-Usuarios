import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-auth.dto';
import { LoginUserDto } from './dto/login-auth.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUpUser(createUserDto: CreateUserDto) {
    const emailUser = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (emailUser)
      throw new BadRequestException(
        `Ya existe un usuario registrado con ese email.`,
      );
  }

  async singInUser(userLogin: LoginUserDto) {
    const userValidated = await this.userService.searchEmail(userLogin.user);

    if (!userValidated)
      throw new HttpException(
        'Algun dato ingresado es incorrecto',
        HttpStatus.NOT_FOUND,
      );
    // console.log(userValidated);
    if (!userValidated.state)
      throw new HttpException('Cuenta Dada de Baja', HttpStatus.NOT_FOUND);

    const passwordValidate = await bcrypt.compare(
      userLogin.password,
      userValidated.password,
    );
    if (!passwordValidate)
      throw new BadRequestException('Algun dato ingresado es incorrecto');

    await this.userRepository.update(
      {
        id: userValidated.id,
      },
      { lastLogin: new Date() },
    );

    const payload = {
      id: userValidated.id,
      email: userValidated.email,
      rol: userValidated.rol,
      image: userValidated.image,
      name: userValidated.name,
      lastName: userValidated.lastName,
      secretariat: userValidated.secretariat,
    };

    const token = this.jwtService.sign(payload);

    const userLoginData = {
      token: token,
      user: userValidated,
    };
    return userLoginData;
  }
}
