import { Module } from '@nestjs/common';
import { SecretariatsService } from './secretariats.service';
import { SecretariatsController } from './secretariats.controller';

@Module({
  imports: [],
  controllers: [SecretariatsController],
  providers: [SecretariatsService],
})
export class SecretariatsModule {}
