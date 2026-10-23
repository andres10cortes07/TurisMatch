import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('favorito')
@Unique('uq_favorito_usuario_sitio', ['identificacion', 'idSitio'])
export class Favorito {
  @PrimaryGeneratedColumn({ name: 'id_favorito' })
  id: number;

  @Column({ type: 'varchar', length: 30 })
  identificacion: string;

  @Column({ type: 'int', name: 'id_sitio' })
  idSitio: number;
}
