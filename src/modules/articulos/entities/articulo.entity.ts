import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Inciso } from './inciso.entity';

@Entity('articulos')
export class Articulo {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: ['PRESENTE', 'AUSENTE'] })
  statusType: 'PRESENTE' | 'AUSENTE';

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Inciso, (inciso) => inciso.articulo, {
    cascade: true,
  })
  incisos: Inciso[];
}
