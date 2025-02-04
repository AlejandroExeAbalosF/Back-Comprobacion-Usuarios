import { Registration } from 'src/modules/registrations/entities/registration.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  password: string;

  @Column({ type: 'varchar', length: 50, nullable: false }) // maximo 50 chars y no puede ser nulo
  name: string;

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 50,
    nullable: true,
    default: 'Google',
  }) // maximo 50 chars y no puede ser nulo
  lastName: string;

  @Column({ type: 'integer', unique: true, nullable: false })
  document: number;

  @Column({
    type: 'varchar',
    default:
      'https://res.cloudinary.com/dcqdilhek/image/upload/fl_preserve_transparency/v1715136207/zmuncvwsnlws77vegwxq.jpg',
  })
  image: string;

  @Column({ type: 'bigint', nullable: true })
  phone: number;

  @Column({ type: 'bigint', nullable: true })
  cellphone: number;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  email: string;

  @Column({ type: 'boolean', default: true })
  state: boolean;

  @Column({ type: 'varchar', default: 'owner' })
  rol: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: new Date(),
    nullable: false,
  })
  createdAt: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @OneToMany(() => Registration, (prop) => prop.user, { eager: true })
  @JoinColumn()
  registrations: Registration[];
}
