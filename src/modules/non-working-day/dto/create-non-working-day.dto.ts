import { Transform } from 'class-transformer';
import {
  IsDate,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateNonWorkingDayDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['FERIADO_FIJO', 'FERIADO_MOVIL', 'VACACIONES_GENERAL', 'CIERRE_ANUAL'])
  readonly type:
    | 'FERIADO_FIJO'
    | 'FERIADO_MOVIL'
    | 'VACACIONES_GENERAL'
    | 'CIERRE_ANUAL';

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  readonly description: string;

  @IsNotEmpty()
  // @Transform(({ value }: { value: string | null }) =>
  //   value ? new Date(value) : null,
  // )
  // @IsDate()
  @IsDateString()
  readonly startDate: string;

  @IsNotEmpty()
  // @Transform(({ value }: { value: string | null }) =>
  //   value ? new Date(value) : null,
  // )
  // @IsDate()
  @IsDateString()
  readonly endDate: Date;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly year: number;
}
