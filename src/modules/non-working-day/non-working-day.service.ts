import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNonWorkingDayDto } from './dto/create-non-working-day.dto';
import { UpdateNonWorkingDayDto } from './dto/update-non-working-day.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NonWorkingDay } from './entities/non-working-day.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NonWorkingDayService {
  constructor(
    @InjectRepository(NonWorkingDay)
    private readonly nonWorkingDayRepository: Repository<NonWorkingDay>,
  ) {}
  create(createNonWorkingDayDto: CreateNonWorkingDayDto) {
    return 'This action adds a new nonWorkingDay';
  }

  async findAll() {
    const nonWorkingDays = await this.nonWorkingDayRepository.find();
    if (!nonWorkingDays)
      throw new NotFoundException('No se encontraron Fechas no laborables');
    return nonWorkingDays;
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
