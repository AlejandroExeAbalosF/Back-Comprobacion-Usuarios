import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeormConfig from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { SeedModule } from './seed/seed.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from './config/jwt.config';

import { TasksModule } from './modules/tasks/tasks.module';
import { MinistriesModule } from './modules/ministries/ministries.module';
import { SecretariatsModule } from './modules/secretariats/secretariats.module';
import { NonWorkingDayModule } from './modules/non-working-day/non-working-day.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const typeOrmConfig = configService.get('typeorm') as DataSourceOptions;
        if (!typeOrmConfig) {
          throw new Error('No se encontró la configuración de TypeORM');
        }
        return typeOrmConfig;
      },
    }),
    JwtModule.register(jwtConfig),
    // TypeOrmModule.forFeature([User]),
    RegistrationsModule,
    SeedModule,

    TasksModule,

    MinistriesModule,

    SecretariatsModule,

    NonWorkingDayModule, //sed module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
