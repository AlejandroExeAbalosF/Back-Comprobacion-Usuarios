import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ unique: true })
  name: string; // 'Mañana', 'Tarde', 'Noche'

  @Column({ type: 'time', name: 'entry_hour', nullable: true })
  entryHour: string; // Se almacena en formato 'HH:MM:SS'

  @Column({ type: 'time', name: 'exit_hour', nullable: true })
  exitHour: string; // Se almacena en formato 'HH:MM:SS'

  @OneToMany(() => User, (user) => user.shift) // 👈 Un turno puede estar asignado a varios usuarios
  users: User[];
}
