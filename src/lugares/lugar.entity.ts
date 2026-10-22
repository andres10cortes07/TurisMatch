
import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity('vista_lugares_backend')
export class Lugar {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'id_categoria' })
  idCategoria: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', length: 100 })
  ciudad: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoria: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  precio: number;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
  })
  calificacion: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitud: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitud: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagen_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  horario: string | null;
}
