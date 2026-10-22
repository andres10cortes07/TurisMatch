import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  assertAllowedKeys,
  requireDate,
  requireEmail,
  requireObject,
  requireText,
} from '../common/validation.js';
import {
  Usuario,
  type RolUsuario,
} from '../database/entities/usuario.entity.js';
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from './password.util.js';

export interface UsuarioPublico {
  identificacion: string;
  tipoDoc: string;
  nombres: string;
  apellidos: string;
  correo: string;
  fechaNacimiento: string;
  rol: RolUsuario;
  fechaRegistro: Date;
}

function usuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    identificacion: usuario.identificacion,
    tipoDoc: usuario.tipoDoc,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    correo: usuario.correo,
    fechaNacimiento: usuario.fechaNacimiento,
    rol: usuario.rol,
    fechaRegistro: usuario.fechaRegistro,
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly users: Repository<Usuario>,
  ) {}

  async register(input: unknown): Promise<UsuarioPublico> {
    const body = requireObject(input);
    assertAllowedKeys(body, [
      'identificacion',
      'tipoDoc',
      'nombres',
      'apellidos',
      'correo',
      'fechaNacimiento',
      'contrasena',
    ]);
    const identificacion = requireText(
      body.identificacion,
      'La identificación',
      30,
    );
    const tipoDoc = requireText(body.tipoDoc, 'El tipo de documento', 20);
    const nombres = requireText(body.nombres, 'Los nombres', 100);
    const apellidos = requireText(body.apellidos, 'Los apellidos', 100);
    const correo = requireEmail(body.correo);
    const fechaNacimiento = requireDate(
      body.fechaNacimiento,
      'La fecha de nacimiento',
    );
    const contrasena = validatePassword(body.contrasena);

    const existing = await this.users.findOne({
      where: [{ identificacion }, { correo }],
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe una cuenta con esa identificación o correo.',
      );
    }

    const user = this.users.create({
      identificacion,
      tipoDoc,
      nombres,
      apellidos,
      correo,
      fechaNacimiento,
      contrasena: await hashPassword(contrasena),
      rol: 'turista',
      fechaRegistro: new Date(),
    });
    return usuarioPublico(await this.users.save(user));
  }

  async login(
    input: unknown,
  ): Promise<UsuarioPublico> {
    const body = requireObject(input);
    assertAllowedKeys(body, ['correo', 'contrasena']);
    const correo = requireEmail(body.correo);
    if (typeof body.contrasena !== 'string' || !body.contrasena) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    const user = await this.users
      .createQueryBuilder('usuario')
      .addSelect('usuario.contrasena')
      .where('LOWER(usuario.correo) = LOWER(:correo)', { correo })
      .getOne();

    const valid = user
      ? await verifyPassword(body.contrasena, user.contrasena)
      : false;
    if (!user || !valid) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    return usuarioPublico(user);
  }

  async getProfile(identificacion: string): Promise<UsuarioPublico> {
    const user = await this.users.findOne({ where: { identificacion } });
    if (!user) throw new UnauthorizedException('La cuenta ya no existe.');
    return usuarioPublico(user);
  }

  async updateProfile(
    identificacion: string,
    input: unknown,
  ): Promise<UsuarioPublico> {
    const body = requireObject(input);
    assertAllowedKeys(body, [
      'tipoDoc',
      'nombres',
      'apellidos',
      'correo',
      'fechaNacimiento',
      'contrasena',
    ]);

    const user = await this.users.findOne({ where: { identificacion } });
    if (!user) throw new UnauthorizedException('La cuenta ya no existe.');

    if (body.tipoDoc !== undefined) {
      user.tipoDoc = requireText(body.tipoDoc, 'El tipo de documento', 20);
    }
    if (body.nombres !== undefined) {
      user.nombres = requireText(body.nombres, 'Los nombres', 100);
    }
    if (body.apellidos !== undefined) {
      user.apellidos = requireText(body.apellidos, 'Los apellidos', 100);
    }
    if (body.fechaNacimiento !== undefined) {
      user.fechaNacimiento = requireDate(
        body.fechaNacimiento,
        'La fecha de nacimiento',
      );
    }
    if (body.correo !== undefined) {
      const correo = requireEmail(body.correo);
      const existing = await this.users.findOne({ where: { correo } });
      if (existing && existing.identificacion !== identificacion) {
        throw new ConflictException('Ese correo ya está registrado.');
      }
      user.correo = correo;
    }
    if (body.contrasena !== undefined) {
      user.contrasena = await hashPassword(validatePassword(body.contrasena));
    }

    return usuarioPublico(await this.users.save(user));
  }

  async listUsers(): Promise<UsuarioPublico[]> {
    const users = await this.users.find({ order: { fechaRegistro: 'DESC' } });
    return users.map(usuarioPublico);
  }
}
