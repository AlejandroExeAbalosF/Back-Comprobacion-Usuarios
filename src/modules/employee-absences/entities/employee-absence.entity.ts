import { User } from 'src/modules/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('employee_absences')
export class EmployeeAbsence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date; // Inicio del período

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date; // Fin del período

  @Column({ type: 'varchar', nullable: true })
  articulo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional: boolean;

  @Column({
    type: 'enum',
    enum: ['ARTICULO', 'OTRO'],
    default: 'ARTICULO',
  })
  type: 'ARTICULO' | 'OTRO';

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.employeeAbsences, {
    onDelete: 'CASCADE',
  })
  user: User; // Relación con el empleado
}
