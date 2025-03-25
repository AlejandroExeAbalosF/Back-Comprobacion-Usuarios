import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'isEndtDateValidConstraint', async: false })
@Injectable()
export class IsEndtDateValidConstraint implements ValidatorConstraintInterface {
  validate(endDate: Date, args: ValidationArguments) {
    // Usamos args.object sin especificar tipo, ya que puede ser cualquier DTO
    const startDate = (args.object as { startDate: Date }).startDate;
    return !endDate || !startDate || endDate >= startDate;
  }

  defaultMessage() {
    return 'La fecha de fin no puede ser anterior a fecha de Inicio';
  }
}
