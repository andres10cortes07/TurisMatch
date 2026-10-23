import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sitioturistico')
export class SitioTuristico {
  @PrimaryGeneratedColumn({ name: 'id_sitio' })
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', length: 255 })
  ubicacion: string;

  @Column({ type: 'varchar', length: 100 })
  ciudad: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagen: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  horario: string | null;

  @Column({ type: 'int', name: 'id_categoria' })
  idCategoria: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitud: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitud: string | null;
}
