import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
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
    
      @Column({ type: 'boolean', default: false })
      is_optional: boolean;

    
      @Column({
        type: 'enum',
        enum: [
          'ARTICULO',
          
        ],
        default: 'ARTICULO',
      })
      type:
        | 'ARTICULO';
    
      @Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
      })
      createdAt: Date;
}
