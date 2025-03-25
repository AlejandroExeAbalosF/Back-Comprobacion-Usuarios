import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Validate,
} from 'class-validator';
import { IsEndtDateValidConstraint } from 'src/decorators/isEndDateValidConstraint.decorator';

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
  readonly startDate: Date;

  @IsNotEmpty()
  // @Transform(({ value }: { value: string | null }) =>
  //   value ? new Date(value) : null,
  // )
  // @IsDate()
  @IsDateString()
  @Validate(IsEndtDateValidConstraint)
  readonly endDate: Date;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly year: number;
}
