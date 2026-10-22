import { Column, Entity, PrimaryColumn } from 'typeorm';

export type RolUsuario = 'administrador' | 'turista';

@Entity('usuario')
export class Usuario {
  @PrimaryColumn({ type: 'varchar', length: 30 })
  identificacion: string;

  @Column({ type: 'varchar', length: 20, name: 'tipo_doc' })
  tipoDoc: string;

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos: string;

  @Column({ type: 'varchar', length: 150 })
  correo: string;

  @Column({ type: 'date', name: 'fecha_nacimiento' })
  fechaNacimiento: string;

  @Column({ type: 'varchar', length: 255, select: false })
  contrasena: string;

  @Column({ type: 'enum', enum: ['administrador', 'turista'] })
  rol: RolUsuario;

  @Column({ type: 'datetime', name: 'fecha_registro' })
  fechaRegistro: Date;
}
