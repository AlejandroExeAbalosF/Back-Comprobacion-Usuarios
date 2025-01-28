import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as usersData from '../helpers/preload-users.data.json';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    //preload on start
    await this.preloadDataUser();
  }

  async preloadDataUser() {
    // try {
    await this.executeSeedUsers();

    Logger.log(
      'Seed de Usuarios cargado correctamente',
      'PreloadData-SIH Secure Ingress Home',
    );
    const message = { message: 'Seed de Usuarios cargado correctamente' };

    return message;
    // } catch (error) {
    //   throw error;
    // }
  }

  private async executeSeedUsers() {
    const users = usersData;

    for (const user of users) {
      if (user && user.email === 'admin@gmail.com') {
        const userSA = await this.userRepository.findOneBy({
          email: user?.email as string | undefined,
        });
        if (userSA) continue;
        const hashedPassword = await bcrypt.hash(
          (user?.password as string) ?? 'admin',
          10,
        );
        const newUser = this.userRepository.create({
          ...user,
          password: hashedPassword,
          rol: 'admin',
        });
        await this.userRepository.save(newUser);
      } else {
        const userFinded = await this.userRepository.findOneBy({
          email: user?.email as string | undefined,
        });
        if (userFinded) continue;

        const newUser = this.userRepository.create({
          ...user,
        });
        await this.userRepository.save(newUser);
      }
    }
  }
}
