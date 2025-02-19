import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { IsEightDigits } from 'src/decorators/digit-count.decorator';

//? Obligatorio el email y el documento
export class CreateUserEmpDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Caracteres inválidos en el correo electrónico',
  })
  readonly email: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  @Validate(IsEightDigits) // custom decorator
  readonly document: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9 ]+$/)
  readonly name: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9 ]+$/)
  readonly lastName: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  @Matches(/^[a-zA-Z]+$/)
  readonly sex: string;

  @IsOptional()
  @IsDateString()
  readonly birthDate: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  readonly phone: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  readonly cellphone?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[\p{L}\p{N}\s,._&-]+$/u)
  readonly privateAddress: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\p{L}\p{N}\s,._&-]+$/u)
  readonly studyLevel: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\p{L}\p{N}\s,._&-]+$/u)
  readonly profession: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\p{L}\p{N}\s,._&-]+$/u)
  readonly function: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\p{L}\p{N}\s,._&-]+$/u)
  readonly asset: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\p{L}\p{N}\s,._&-]+$/u)
  readonly situation: string;

  @IsOptional()
  @IsDateString()
  readonly incomeDate: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\p{L}\p{N}\s,._&-]+$/u)
  readonly legalInstrument: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\p{L}\p{N}\s,._&-]+$/u)
  readonly laborAddress: string;

  //! pasarlo a tablas
  @IsOptional()
  @IsString()
  @Matches(/^[\p{L}\p{N}\s,._&-]+$/u)
  readonly ministry: string;

  @IsOptional()
  @IsString()
  readonly secretariatId: string;
  //!
}
