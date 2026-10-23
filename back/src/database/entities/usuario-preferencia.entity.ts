import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('usuariopreferencia')
export class UsuarioPreferencia {
  @PrimaryColumn({ type: 'varchar', length: 30 })
  identificacion: string;

  @PrimaryColumn({ type: 'int', name: 'id_preferencia' })
  idPreferencia: number;

  @Column({ type: 'int', name: 'nivel_interes', nullable: true })
  nivelInteres: number | null;
}
