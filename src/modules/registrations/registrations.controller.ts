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

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('/dniAndCature') // Para el registro de ingreso e egreso
  @UseInterceptors(FileInterceptor('file'), OptionalFileInterceptorIMG)
  registrations(
    @Body() registrationDto: CreateRegistrationDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // console.log(
    //   JSON.stringify(registrationDto) + ' ' + JSON.stringify(file),
    // );
    return this.registrationsService.registrationsByUser(registrationDto, file);
  }

  @Post()
  create(@Body() createRegistrationDto: CreateRegistrationDto) {
    return this.registrationsService.create(createRegistrationDto);
  }

  @Get()
  findAll() {
    return this.registrationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registrationsService.findOne(+id);
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
