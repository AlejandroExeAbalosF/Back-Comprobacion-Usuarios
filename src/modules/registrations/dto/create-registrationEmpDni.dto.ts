import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  Validate,
} from 'class-validator';
import { IsEightDigits } from 'src/decorators/digit-count.decorator';

export class CreateRegistrationEmpDniDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Validate(IsEightDigits) // custom decorator
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  readonly document: number;
}
