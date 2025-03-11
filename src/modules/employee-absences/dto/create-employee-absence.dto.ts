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
export class CreateEmployeeAbsenceDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['ARTICULO', 'OTRO'])
  readonly type: 'ARTICULO' | 'OTRO';

  @IsOptional()
  @IsString()
  readonly articulo: string | null;

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
}
