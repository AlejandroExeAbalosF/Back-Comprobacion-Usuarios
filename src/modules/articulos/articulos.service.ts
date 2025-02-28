import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticuloDto } from './dto/create-articulo.dto';
import { UpdateArticuloDto } from './dto/update-articulo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Articulo } from './entities/articulo.entity';
import { Repository } from 'typeorm';
import { Inciso } from './entities/inciso.entity';
import { SubInciso } from './entities/sub-inciso.entity';

@Injectable()
export class ArticulosService {
  constructor(
    @InjectRepository(Articulo)
    private readonly articuloRepository: Repository<Articulo>,
    @InjectRepository(Inciso)
    private readonly incisoRepository: Repository<Inciso>,
    @InjectRepository(SubInciso)
    private readonly subIncisoRepository: Repository<SubInciso>,
  ) {}
  create(createArticuloDto: CreateArticuloDto) {
    return 'This action adds a new articulo';
  }

  async findAll() {
    const articulos = await this.articuloRepository.find({
      relations: ['incisos', 'incisos.subIncisos'],
    });
    if (!articulos) throw new NotFoundException('No se encontraron Articulos');
    // Ordenar los artículos numéricamente si el nombre es un número
    articulos.sort((a, b) => {
      const numA = parseFloat(a.name); // Convertir el nombre a número
      const numB = parseFloat(b.name); // Convertir el nombre a número
      return numA - numB; // Comparar los números
    });

    // Ordenar los incisos alfabéticamente dentro de cada artículo
    articulos.forEach((articulo) => {
      articulo.incisos.sort((a, b) => a.name.localeCompare(b.name));

      // Ordenar los subincisos alfabéticamente dentro de cada inciso
      articulo.incisos.forEach((inciso) => {
        inciso.subIncisos.sort((a, b) => {
          const numA = parseFloat(a.name);
          const numB = parseFloat(b.name);
          return numA - numB;
        });
      });
    });
    return articulos;
  }

  async getArticulosIncisosSubIncisos() {
    const articulos = await this.articuloRepository.find();
    const incisos = await this.incisoRepository.find();
    const subIncisos = await this.subIncisoRepository.find();
    if (!articulos && !incisos && !subIncisos)
      throw new NotFoundException(
        'No se encontraron Articulos Incisos SubIncisos',
      );
    return {
      articulos,
      incisos,
      subIncisos,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} articulo`;
  }

  update(id: number, updateArticuloDto: UpdateArticuloDto) {
    return `This action updates a #${id} articulo`;
  }

  remove(id: number) {
    return `This action removes a #${id} articulo`;
  }
}
