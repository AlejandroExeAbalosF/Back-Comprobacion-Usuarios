import { IsNotEmpty } from 'class-validator';

export class CreateNonWorkingDayDto {
  @IsNotEmpty()
  readonly start_date: Date;

  @IsNotEmpty()
  readonly end_date: Date;
}
