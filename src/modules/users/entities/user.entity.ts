import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "users"})
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: 'varchar', length: 50, unique: true, nullable: true }) // maximo 50 chars y no puede ser nulo
    username: string;
  
    @Column({ type: 'text', nullable: false })
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
  
    @Column({ type: 'integer', unique: true, nullable: true })
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

    @Column({
      name: 'created_at',
      type: 'timestamp',
      default: new Date(),
      nullable: false,
    })
    createdAt: Date;

    @Column({type: 'boolean', default: false })
    validated: boolean;

    @Column({type: 'varchar',
      default:
        'https://res.cloudinary.com/dcqdilhek/image/upload/fl_preserve_transparency/v1715136207/zmuncvwsnlws77vegwxq.jpg',})
    capture: string;

    @Column({ name: 'date_validated', type: 'timestamp', nullable: true })
    dateValidated: Date;
}
