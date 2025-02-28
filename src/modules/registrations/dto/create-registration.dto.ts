import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  Validate,
} from 'class-validator';
import { IsEightDigits } from 'src/decorators/digit-count.decorator';

export class CreateRegistrationDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  readonly type: string | null;

  @IsNotEmpty()
  @IsString()
  @IsIn(['PRESENTE', 'AUSENTE', 'TRABAJANDO', 'NO_LABORABLE']) // 👈 Solo permite estos valores
  readonly status: 'PRESENTE' | 'AUSENTE' | 'TRABAJANDO' | 'NO_LABORABLE';

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  readonly articulo: string | null;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  readonly description: string | null;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  readonly comment: string | null;

  @IsNotEmpty()
  @Transform(({ value }: { value: string | null }) =>
    value ? new Date(value) : null,
  )
  @IsDate()
  readonly entryDate: Date | null;

  @IsNotEmpty()
  @IsString()
  readonly entryCapture: string | null;

  @IsNotEmpty()
  @Transform(({ value }: { value: string | null }) =>
    value ? new Date(value) : null,
  )
  @IsDate()
  readonly exitDate: Date | null;

  @IsNotEmpty()
  @IsString()
  readonly exitCapture: string | null;
}
