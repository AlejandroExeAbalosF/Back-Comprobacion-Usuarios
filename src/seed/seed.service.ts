import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as usersData from '../helpers/preload-users.data copy.json';
import * as registrationsData from '../helpers/preload-registrations.data.json';
import * as bcrypt from 'bcrypt';
import { CreateRegistrationDto } from 'src/modules/registrations/dto/create-registration.dto';
import { Registration } from 'src/modules/registrations/entities/registration.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
  ) {}

  async onModuleInit() {
    //preload on start
    await this.preloadDataUser();
    await this.preloadDataRegistration();
  }

  async preloadDataUser() {
    // try {
    await this.executeSeedUsers();

    Logger.log('Seed de Usuarios cargado correctamente', 'PreloadData');
    const message = { message: 'Seed de Usuarios cargado correctamente' };

    return message;
    // } catch (error) {
    //   throw error;
    // }
  }

  async preloadDataRegistration() {
    await this.executeSeedRegistrations();
    Logger.log('Seed de Registros cargado correctamente', 'PreloadData');
    const message = { message: 'Seed de Registros cargado correctamente' };
    return message;
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
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          document: user.document,
          ministry: user.ministry,
          secretariat: user.secretariat,
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

  async executeSeedRegistrations() {
    const registration = registrationsData.map((register) => ({
      ...register,
      entryDate: register.entryDate ? new Date(register.entryDate) : null,
      exitDate: register.exitDate ? new Date(register.exitDate) : null,
    })) as CreateRegistrationDto[];
    const users: User[] = await this.userRepository.find({
      where: { rol: 'user' },
    });
    try {
      for (const user of users) {
        let newRegistrations: CreateRegistrationDto;
        for (const register of registration) {
          const date =
            register.entryDate !== null
              ? Date.parse(register.entryDate?.toISOString())
              : null;

          const registerFindedUser =
            await this.registrationRepository.findOneBy({
              entryDate: date ? new Date(date) : undefined, // Fecha específica
              user: user, // Usuario específico
            });
          if (registerFindedUser) continue;

          newRegistrations = this.registrationRepository.create({
            ...register,
            entryDate: register.entryDate ? new Date(register.entryDate) : null,
            exitDate: register.exitDate ? new Date(register.exitDate) : null,
            user: user,
          });
          await this.registrationRepository.save(newRegistrations);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
