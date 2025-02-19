import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('non_working_days')
export class NonWorkingDay {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ type: 'date' })
  start_date: string; // Inicio del período

  @Column({ type: 'date' })
  end_date: string; // Fin del período

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'boolean', default: false })
  is_optional: boolean;

  @Column({ type: 'int', nullable: true })
  year?: number; // Si es NULL, aplica todos los años

  // @Column({
  //   type: 'enum',
  //   enum: ['FERIADO_FIJO', 'FERIADO_MOVIL', 'VACACIONES', 'CIERRE_ANUAL'],
  //   default: 'FERIADO',
  // })
  // type: 'FERIADO_FIJO' | 'FERIADO_MOVIL' | 'VACACIONES' | 'CIERRE_ANUAL';
}
