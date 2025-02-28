import { Registration } from 'src/modules/registrations/entities/registration.entity';
import { Secretariat } from 'src/modules/secretariats/entities/secretariat.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Shift } from './shift.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  password: string;

  @Column({ type: 'time', name: 'entry_hour', nullable: true })
  entryHour: string | null; // Se almacena en formato 'HH:MM:SS'

  @Column({ type: 'time', name: 'exit_hour', nullable: true })
  exitHour: string | null; // Se almacena en formato 'HH:MM:SS'

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
    default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    nullable: true,
  })
  image: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sex: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  asset: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  situation: string;

  @Column({
    name: 'income_date',
    type: 'date',
    nullable: true,
  })
  incomeDate: Date | null;

  @Column({
    type: 'date',
    name: 'birth_date',
    nullable: true,
  })
  birthDate: Date | null;

  @Column({ type: 'bigint', nullable: true })
  phone: number | null;

  @Column({ type: 'bigint', nullable: true })
  cellphone: number | null;

  @Column({ type: 'text', name: 'private_address', nullable: true })
  privateAddress: string;

  @Column({ type: 'varchar', length: 50, name: 'study_level', nullable: true })
  studyLevel: string;

  @Column({ type: 'text', nullable: true })
  profession: string;

  @Column({ type: 'text', nullable: true })
  function: string;

  @Column({ type: 'text', name: 'legal_instrument', nullable: true })
  legalInstrument: string;

  @Column({ type: 'text', name: 'labor_address', nullable: true })
  laborAddress: string;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  email: string;

  @Column({ type: 'boolean', default: true })
  state: boolean;

  @Column({ type: 'varchar', default: 'user', nullable: true })
  rol: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @OneToMany(() => Registration, (prop) => prop.user)
  registrations: Registration[];

  @ManyToOne(() => Secretariat, (secretariat) => secretariat.user, {
    nullable: true,
  })
  @JoinColumn({ name: 'secretariat_id' })
  secretariat: Secretariat;

  @ManyToOne(() => Shift, (shift) => shift.users) // 👈 Cada usuario tiene un solo turno
  shift: Shift;
}
