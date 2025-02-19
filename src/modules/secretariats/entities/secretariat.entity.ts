import { Ministry } from 'src/modules/ministries/entities/ministry.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'secretariats' })
export class Secretariat {
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

  @ManyToOne(() => Ministry, (prop) => prop.secretariats)
  @JoinColumn()
  ministry: Ministry;

  @OneToMany(() => User, (user) => user.secretariat)
  user: User[];
}
