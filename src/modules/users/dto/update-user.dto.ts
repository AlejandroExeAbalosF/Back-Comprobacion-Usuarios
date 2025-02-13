import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CreateUserEmpDto } from './create-userEmp.dto';

export class UpdateUserDto extends PartialType(CreateUserEmpDto) {}
