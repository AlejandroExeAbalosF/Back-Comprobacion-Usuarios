import { Module } from '@nestjs/common';
import { ArticulosService } from './articulos.service';
import { ArticulosController } from './articulos.controller';

@Module({
  controllers: [ArticulosController],
  providers: [ArticulosService],
})
export class ArticulosModule {}
