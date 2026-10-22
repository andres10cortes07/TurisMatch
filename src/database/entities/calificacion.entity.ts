import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('calificacion')
export class Calificacion {
  @PrimaryGeneratedColumn({ name: 'id_calificacion' })
  id: number;

  @Column({ type: 'int' })
  puntuacion: number;

  @Column({ type: 'text', nullable: true })
  comentario: string | null;

  @Column({ type: 'datetime' })
  fecha: Date;

  @Column({ type: 'varchar', length: 30 })
  identificacion: string;

  @Column({ type: 'int', name: 'id_sitio' })
  idSitio: number;
}
