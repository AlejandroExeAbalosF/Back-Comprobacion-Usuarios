import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { OptionalFileInterceptorIMG } from 'src/interceptors/fileValidation.interceptor';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { extname } from 'path';
import { config as dotenvConfig } from 'dotenv';
import { CreateRegistrationEmpDniDto } from './dto/create-registrationEmpDni.dto';
import { UserWithLastRegistration } from 'src/helpers/types';

dotenvConfig({ path: '.env' });

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('user/:id')
  async getUserRegistrations(@Param('id') userId: string) {
    return this.registrationsService.getRegistrationsByUserId(userId);
  }

  @Post('/dniAndCature') // Para el registro de ingreso e egreso
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads';

          // Verificar si la carpeta 'uploads' existe, si no, crearla
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Generar un nombre único para la imagen
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
    OptionalFileInterceptorIMG,
  )
  registrations(
    @Body() registrationDto: CreateRegistrationEmpDniDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // console.log('Body:', registrationDto);
    // console.log('File:', file);
    // console.log(JSON.stringify(registrationDto) + ' ' + JSON.stringify(file));
    // console.log('name', file);
    const urlFile = file
      ? process.env.URL_BACKEND + '/uploads/' + file.filename
      : null;
    // console.log(urlFile);
    return this.registrationsService.registrationsByUser(
      registrationDto,
      urlFile,
    );
  }

  @Post('/validationsRegistrationsToday')
  async validationsRegistrations(@Body() secretariat) {
    console.log('secretariat', secretariat.secretariatName);
    return await this.registrationsService.validationsRegistrationsToday(
      secretariat.secretariatName,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRegistrationDto: UpdateRegistrationDto,
  ) {
    return this.registrationsService.update(+id, updateRegistrationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registrationsService.remove(+id);
  }
}
