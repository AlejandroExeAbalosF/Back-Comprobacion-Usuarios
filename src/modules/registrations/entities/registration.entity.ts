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

  @Column({ type: 'boolean' })
  validated: boolean;

  @Column({ type: 'boolean', default: true })
  state: boolean;

  //   @Column({
  //     type: 'varchar',
  //     nullable: true,
  //   })
  //   present: string; // presente en el trabajo , en caso q no fuera asi se podria cambiar?

  @Column({
    type: 'bytea',
    name: 'entry_capture',
    nullable: true,
  })
  entryCapture: Buffer; // Usamos Buffer para almacenar los datos binarios

  @Column({
    type: 'bytea',
    name: 'exit_capture',
    nullable: true,
  })
  exitCapture: Buffer;

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
