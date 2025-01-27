import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ){}

    async signUpUser (createUserDto: CreateUserDto){
        const emailUser = await this.userRepository.findOneBy({
            email: createUserDto.email,
          });
          if (emailUser)
            throw new BadRequestException(
              `Ya existe un usuario registrado con ese email.`,
            );
        
    }
}
