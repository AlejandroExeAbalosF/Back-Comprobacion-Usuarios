import { Module } from '@nestjs/common';
import { ArticulosService } from './articulos.service';
import { ArticulosController } from './articulos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Articulo } from './entities/articulo.entity';
import { SubInciso } from './entities/sub-inciso.entity';
import { Inciso } from './entities/inciso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Articulo, Inciso, SubInciso])],
  controllers: [ArticulosController],
  providers: [ArticulosService],
})
export class ArticulosModule {}
