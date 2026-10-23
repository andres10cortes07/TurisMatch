import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('preferencia')
export class Preferencia {
  @PrimaryGeneratedColumn({ name: 'id_preferencia' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;
}
