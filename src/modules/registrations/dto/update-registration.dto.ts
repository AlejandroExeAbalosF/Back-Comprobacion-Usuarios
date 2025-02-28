import { PartialType } from '@nestjs/mapped-types';
import { CreateRegistrationDto } from './create-registration.dto';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateRegistrationDto extends PartialType(CreateRegistrationDto) {
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'La hora de entrada debe estar en formato HH:mm',
  })
  readonly entryHour?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'La hora de salida debe estar en formato HH:mm',
  })
  readonly exitHour?: string;
}
