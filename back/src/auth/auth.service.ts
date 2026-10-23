import {
  BadRequestException,
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
    return this.createUser(input, 'turista');
  }

  async createManagedUser(input: unknown): Promise<UsuarioPublico> {
    const body = requireObject(input);
    assertAllowedKeys(body, [
      'identificacion',
      'tipoDoc',
      'nombres',
      'apellidos',
      'correo',
      'fechaNacimiento',
      'contrasena',
      'rol',
    ]);
    if (body.rol !== 'administrador' && body.rol !== 'turista') {
      throw new BadRequestException('El rol seleccionado no es válido.');
    }
    const { rol, ...userInput } = body;
    return this.createUser(userInput, rol);
  }

  private async createUser(
    input: unknown,
    rol: RolUsuario,
  ): Promise<UsuarioPublico> {
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
      rol,
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
      'contrasenaActual',
    ]);

    const query = this.users
      .createQueryBuilder('usuario')
      .where('usuario.identificacion = :identificacion', { identificacion });
    if (body.contrasena !== undefined) {
      query.addSelect('usuario.contrasena');
    }
    const user = await query.getOne();
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
      if (
        typeof body.contrasenaActual !== 'string' ||
        !body.contrasenaActual ||
        !(await verifyPassword(body.contrasenaActual, user.contrasena))
      ) {
        throw new UnauthorizedException(
          'La contraseña actual no es correcta.',
        );
      }
      user.contrasena = await hashPassword(validatePassword(body.contrasena));
    } else if (body.contrasenaActual !== undefined) {
      throw new BadRequestException(
        'La contraseña actual solo se envía para cambiar la contraseña.',
      );
    }

    return usuarioPublico(await this.users.save(user));
  }

  async updateManagedUser(
    identificacion: string,
    input: unknown,
    requestingUserId: string,
  ): Promise<UsuarioPublico> {
    const body = requireObject(input);
    assertAllowedKeys(body, [
      'tipoDoc',
      'nombres',
      'apellidos',
      'correo',
      'fechaNacimiento',
      'contrasena',
      'rol',
    ]);
    if (Object.keys(body).length === 0) {
      throw new BadRequestException('Indica al menos un dato para actualizar.');
    }
    if (
      body.rol !== undefined &&
      body.rol !== 'administrador' &&
      body.rol !== 'turista'
    ) {
      throw new BadRequestException('El rol seleccionado no es válido.');
    }
    if (
      identificacion === requestingUserId &&
      body.rol === 'turista'
    ) {
      throw new BadRequestException(
        'No puedes quitarte a ti mismo el rol de administrador.',
      );
    }

    const query = this.users
      .createQueryBuilder('usuario')
      .where('usuario.identificacion = :identificacion', { identificacion });
    if (body.contrasena !== undefined) {
      query.addSelect('usuario.contrasena');
    }
    const user = await query.getOne();
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
    if (body.rol !== undefined) {
      user.rol = body.rol;
    }

    return usuarioPublico(await this.users.save(user));
  }

  async listUsers(search?: string): Promise<UsuarioPublico[]> {
    const query = this.users.createQueryBuilder('usuario');
    if (search?.trim()) {
      query.where(
        `LOWER(CONCAT(usuario.nombres, ' ', usuario.apellidos)) LIKE LOWER(:search)
          OR LOWER(usuario.correo) LIKE LOWER(:search)
          OR LOWER(usuario.identificacion) LIKE LOWER(:search)`,
        { search: `%${search.trim()}%` },
      );
    }
    const users = await query
      .orderBy('usuario.fechaRegistro', 'DESC')
      .getMany();
    return users.map(usuarioPublico);
  }

  async findUser(identificacion: string): Promise<UsuarioPublico | null> {
    const user = await this.users.findOne({ where: { identificacion } });
    return user ? usuarioPublico(user) : null;
  }
}
