import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { CreateUserEmpDto } from './dto/create-userEmp.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { OptionalFileInterceptorIMG } from 'src/interceptors/fileValidation.interceptor';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { extname } from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // return this.usersService.create(createUserDto);
  }

  @Get('/shifts')
  findAllShift() {
    return this.usersService.findAllShift();
  }

  @UseGuards(AuthGuard)
  @Get('/users_with_last_registration')
  findAllWithLastRegistration() {
    // return { msj: 'hola' };
    return this.usersService.getUsersWithLastRegistration();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('/createEmployee')
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
  createEmployee(
    @Body() createUserDto: CreateUserEmpDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // console.log(createUserDto);
    // console.log('file de empleado', file);

    const urlFile = file
      ? process.env.URL_BACKEND + '/uploads/' + file.filename
      : null;
    // console.log('urlFile', urlFile);
    return this.usersService.createEmployee(createUserDto, urlFile);
    // return { msj: 'hola' };
  }

  @Put('update/:id')
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
  updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const urlFile = file
      ? process.env.URL_BACKEND + '/uploads/' + file.filename
      : null;
    // console.log('id', id, 'updateUserDto', updateUserDto, 'file', urlFile);
    return this.usersService.updateUser(id, updateUserDto, urlFile);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
