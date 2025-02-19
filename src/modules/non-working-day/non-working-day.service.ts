import { Injectable } from '@nestjs/common';
import { CreateNonWorkingDayDto } from './dto/create-non-working-day.dto';
import { UpdateNonWorkingDayDto } from './dto/update-non-working-day.dto';

@Injectable()
export class NonWorkingDayService {
  create(createNonWorkingDayDto: CreateNonWorkingDayDto) {
    return 'This action adds a new nonWorkingDay';
  }

  findAll() {
    return `This action returns all nonWorkingDay`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nonWorkingDay`;
  }

  update(id: number, updateNonWorkingDayDto: UpdateNonWorkingDayDto) {
    return `This action updates a #${id} nonWorkingDay`;
  }

  remove(id: number) {
    return `This action removes a #${id} nonWorkingDay`;
  }
}
