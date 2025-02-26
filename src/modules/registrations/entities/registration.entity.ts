import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
  name: 'registrations',
})
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column({ type: 'varchar' })
  // validated: string;

  @Column({ type: 'boolean', default: true })
  state: boolean;

  //   @Column({
  //     type: 'varchar',
  //     nullable: true,
  //   })
  //   present: string; // presente en el trabajo , en caso q no fuera asi se podria cambiar?

  @Column({
    type: 'text',
    name: 'entry_capture',
    nullable: true,
  })
  entryCapture: string | null; // Usamos string para almacenar los datos binarios

  @Column({
    type: 'text',
    name: 'exit_capture',
    nullable: true,
  })
  exitCapture: string | null;

  @Column({ name: 'entry_date', type: 'timestamp', nullable: true })
  entryDate: Date | null;

  @Column({ name: 'exit_date', type: 'timestamp', nullable: true })
  exitDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  articulo: string | null;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  comment: string | null;

  @Column({ type: 'varchar', nullable: true })
  justification: string | null;

  @Column({
    type: 'enum',
    enum: ['PRESENTE', 'AUSENTE', 'TRABAJANDO', 'NO_LABORABLE'],
    default: 'PRESENTE',
  })
  status: 'PRESENTE' | 'AUSENTE' | 'TRABAJANDO' | 'NO_LABORABLE';

  @Column({
    type: 'varchar',
    nullable: true,
  })
  type: string;
  // enum: ['ASISTENCIA', 'AUSENTE', 'PERMISO', 'TARDANZA'],
  //  'present' | 'absent' | 'permission' | 'delay'
  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: new Date(),
    nullable: false,
  })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.registrations)
  @JoinColumn({ name: 'user_id' }) // Aquí es donde se define la clave foránea
  user: User;
}
