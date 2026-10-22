import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('plan')
export class Plan {
  @PrimaryGeneratedColumn({ name: 'id_plan' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: string;

  @Column({ type: 'varchar', length: 100 })
  duracion: string;

  @Column({ type: 'int', nullable: true })
  cupo: number | null;

  @Column({ type: 'int', name: 'id_sitio' })
  idSitio: number;
}
