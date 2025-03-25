import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { IsEndtDateValidConstraint } from 'src/decorators/isEndDateValidConstraint.decorator';
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
  readonly startDate: Date;

  @IsNotEmpty()
  // @Transform(({ value }: { value: string | null }) =>
  //   value ? new Date(value) : null,
  // )
  // @IsDate()
  @IsDateString()
  @Validate(IsEndtDateValidConstraint)
  readonly endDate: Date;
}
