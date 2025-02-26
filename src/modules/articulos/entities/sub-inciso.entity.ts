import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Inciso } from './inciso.entity';

@Entity('sub_incisos')
export class SubInciso {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Inciso, (inciso) => inciso.subIncisos, {
    onDelete: 'CASCADE',
  })
  inciso: Inciso;
}
