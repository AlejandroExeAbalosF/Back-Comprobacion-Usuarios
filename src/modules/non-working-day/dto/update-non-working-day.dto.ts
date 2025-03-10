import { PartialType } from '@nestjs/mapped-types';
import { CreateNonWorkingDayDto } from './create-non-working-day.dto';

export class UpdateNonWorkingDayDto extends PartialType(
  CreateNonWorkingDayDto,
) {}
