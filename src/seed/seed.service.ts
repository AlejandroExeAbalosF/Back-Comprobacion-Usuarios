import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as usersData from '../helpers/preload-users.data copy.json';
import * as registrationsData from '../helpers/preload-registrations.data.json';
import * as registrations1Data from '../helpers/preload-1registers.data.json';
import * as ministriesData from '../helpers/preload-ministries.data.json';
import * as secretariatsData from '../helpers/preload-secretariat.data.json';
import * as bcrypt from 'bcrypt';
import { CreateRegistrationDto } from 'src/modules/registrations/dto/create-registration.dto';
import { Registration } from 'src/modules/registrations/entities/registration.entity';
import { Ministry } from 'src/modules/ministries/entities/ministry.entity';
import { Secretariat } from 'src/modules/secretariats/entities/secretariat.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(Ministry)
    private readonly ministryRepository: Repository<Ministry>,
    @InjectRepository(Secretariat)
    private readonly secretariatRepository: Repository<Secretariat>,
  ) {}

  async onModuleInit() {
    //preload on start
    await this.preloadDataMinistries();
    await this.preloadDataSecretariats();
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

  async preloadDataMinistries() {
    await this.executeSeedMinistries();
    Logger.log('Seed de Ministerios cargado correctamente', 'PreloadData');
    const message = { message: 'Seed de Ministerios cargado correctamente' };
    return message;
  }

  async preloadDataSecretariats() {
    await this.executeSeedSecretariats();
    Logger.log('Seed de Secretarias cargado correctamente', 'PreloadData');
    const message = { message: 'Seed de Secretarias cargado correctamente' };
    return message;
  }

  private async executeSeedUsers() {
    const users = usersData;

    for (const user of users) {
      const userFinded = await this.userRepository.findOneBy({
        email: user.email,
      });
      if (userFinded) continue;
      if (user && user.email === 'admin@gmail.com') {
        // const userSA = await this.userRepository.findOneBy({
        //   email: user?.email as string | undefined,
        // });
        // if (userSA) continue;
        const secretariatFinded = await this.secretariatRepository.findOneBy({
          name: user?.secretariat as string | undefined,
        });
        if (!secretariatFinded) continue;
        const hashedPassword = await bcrypt.hash(
          (user?.password as string) ?? 'admin',
          10,
        );
        const newUser = this.userRepository.create({
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          document: user.document,
          secretariat: secretariatFinded,
          password: hashedPassword,
          rol: 'admin',
        });
        await this.userRepository.save(newUser);
      } else {
        const secretariatFinded = await this.secretariatRepository.findOneBy({
          name: user?.secretariat as string | undefined,
        });
        // if (!secretariatFinded) continue;
        const { secretariat, ...userData } = user;
        const newUser = this.userRepository.create({
          ...userData,
          secretariat: secretariatFinded ? secretariatFinded : undefined,
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
    const registers1data = registrations1Data.map((register) => ({
      ...register,
      entryDate: register.entryDate ? new Date(register.entryDate) : null,
      exitDate: register.exitDate ? new Date(register.exitDate) : null,
    }));
    const users: User[] = await this.userRepository.find({
      where: { rol: 'user' },
    });
    try {
      for (const user of users) {
        let newRegistrations: CreateRegistrationDto;
        if (user.document === 20399030) {
          for (const register of registers1data) {
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
              entryDate: register.entryDate
                ? new Date(register.entryDate)
                : null,
              exitDate: register.exitDate ? new Date(register.exitDate) : null,
              user: user,
            });
            await this.registrationRepository.save(newRegistrations);
          }
        }
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

  async executeSeedMinistries() {
    const ministries = ministriesData;

    for (const ministry of ministries) {
      const ministryFinded = await this.ministryRepository.findOneBy({
        name: ministry.name,
      });
      if (ministryFinded) continue;
      const newMinistry = this.ministryRepository.create({
        ...ministry,
      });
      await this.ministryRepository.save(newMinistry);
    }
  }

  async executeSeedSecretariats() {
    const secretariats = secretariatsData;

    for (const secretariat of secretariats) {
      const secretariatFinded = await this.secretariatRepository.findOneBy({
        name: secretariat.name,
      });
      if (secretariatFinded) continue;

      const ministryFinded = await this.ministryRepository.findOneBy({
        name: secretariat.ministry,
      });
      if (!ministryFinded) continue;
      const newSecretariat = this.secretariatRepository.create({
        ...secretariat,
        ministry: ministryFinded,
      });
      await this.secretariatRepository.save(newSecretariat);
    }
  }
}
