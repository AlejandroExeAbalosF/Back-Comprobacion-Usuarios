import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';
import { Ministry } from './entities/ministry.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MinistriesService {
  constructor(
    @InjectRepository(Ministry)
    private ministryRepository: Repository<Ministry>,
  ) {}
  async create(createMinistryDto: CreateMinistryDto) {
    return 'This action adds a new ministry';
  }

  async findAll() {
    const ministries = await this.ministryRepository.find({
      relations: ['secretariats'],
    });
    if (!ministries)
      throw new NotFoundException('No se encontraron Ministerios');
    return ministries;
  }

  async findOne(name: string) {
    const ministries = await this.ministryRepository.findOne({
      where: { name },
      relations: ['secretariats'],
    });
    if (!ministries)
      throw new NotFoundException('No se encontraron Ministerios');
    return ministries;
  }

  update(id: number, updateMinistryDto: UpdateMinistryDto) {
    return `This action updates a #${id} ministry`;
  }

  remove(id: number) {
    return `This action removes a #${id} ministry`;
  }
}
