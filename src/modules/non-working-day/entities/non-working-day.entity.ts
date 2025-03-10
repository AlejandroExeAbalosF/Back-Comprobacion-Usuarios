import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('non_working_days')
export class NonWorkingDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date; // Inicio del período

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date; // Fin del período

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  is_optional: boolean;

  @Column({ type: 'int', nullable: true })
  year?: number; // Si es NULL, aplica todos los años

  @Column({
    type: 'enum',
    enum: [
      'FERIADO_FIJO',
      'FERIADO_MOVIL',
      'VACACIONES_GENERAL',
      'CIERRE_ANUAL',
    ],
    default: 'FERIADO_FIJO',
  })
  type:
    | 'FERIADO_FIJO'
    | 'FERIADO_MOVIL'
    | 'VACACIONES_GENERAL'
    | 'CIERRE_ANUAL';

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;
}
