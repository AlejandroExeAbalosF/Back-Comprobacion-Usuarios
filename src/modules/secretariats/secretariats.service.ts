import { Injectable } from '@nestjs/common';
import { CreateSecretariatDto } from './dto/create-secretariat.dto';
import { UpdateSecretariatDto } from './dto/update-secretariat.dto';

@Injectable()
export class SecretariatsService {
  create(createSecretariatDto: CreateSecretariatDto) {
    return 'This action adds a new secretariat';
  }

  findAll() {
    return `This action returns all secretariats`;
  }

  findOne(id: number) {
    return `This action returns a #${id} secretariat`;
  }

  update(id: number, updateSecretariatDto: UpdateSecretariatDto) {
    return `This action updates a #${id} secretariat`;
  }

  remove(id: number) {
    return `This action removes a #${id} secretariat`;
  }
}
