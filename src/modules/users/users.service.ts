import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../auth/dto/create-auth.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User)
  private readonly userService: Repository<User>,
  private readonly dataSource: DataSource,
){}

  findAll() {
    const users = this.userService.find()

    if (!users)
      throw new NotFoundException('No se encontraron usuarios');
    return users;
  }

  async create(createUserDto: CreateUserDto ) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)
    const userData = {
      ...CreateUserDto,
      password: hashedPassword,
    }
    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let newUserSave = User;


    } catch (error) {
      
    }
    return 'This action adds a new user';
  }


  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
