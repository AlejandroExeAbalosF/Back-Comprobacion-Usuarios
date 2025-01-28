import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, Validate } from 'class-validator';
import { IsEightDigits } from 'src/decorators/digit-count.decorator';

export class CreateRegistrationDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  @Validate(IsEightDigits) // custom decorator
  readonly document: number;
}
