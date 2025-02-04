import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
  name: 'registrations',
})
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  validated: string;

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
  entryCapture: string; // Usamos string para almacenar los datos binarios

  @Column({
    type: 'text',
    name: 'exit_capture',
    nullable: true,
  })
  exitCapture: string;

  @Column({ name: 'entry_date', type: 'timestamp', nullable: true })
  entryDate: Date;

  @Column({ name: 'exit_date', type: 'timestamp', nullable: true })
  exitDate: Date;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: new Date(),
    nullable: false,
  })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.registrations)
  user: User;
}
