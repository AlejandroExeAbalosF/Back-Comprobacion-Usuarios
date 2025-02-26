import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Articulo } from './articulo.entity';
import { SubInciso } from './sub-inciso.entity';

@Entity('incisos')
export class Inciso {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Articulo, (articulo) => articulo.incisos, {
    onDelete: 'CASCADE',
  })
  articulo: Articulo;

  @OneToMany(() => SubInciso, (subIncisos) => subIncisos.inciso, {
    cascade: true,
  })
  subIncisos: SubInciso[];
}
