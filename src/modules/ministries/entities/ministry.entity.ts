import { Secretariat } from 'src/modules/secretariats/entities/secretariat.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'ministries' })
export class Ministry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: false }) // maximo 50 chars y no puede ser nulo
  name: string;

  @Column({ type: 'text', name: 'private_address', nullable: true })
  privateAddress: string;

  @Column({ type: 'text', nullable: true })
  function: string;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @OneToMany(() => Secretariat, (prop) => prop.ministry)
  secretariats: Secretariat[];
}
