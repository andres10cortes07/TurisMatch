import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../database/entities/usuario.entity.js';
import type { SolicitudAutenticada } from '../common/auth.types.js';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Usuario)
    private readonly users: Repository<Usuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<SolicitudAutenticada>();
    const identificacion = request.session?.userId;
    if (!identificacion) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    const user = await this.users.findOne({
      where: { identificacion },
    });
    if (!user) {
      await new Promise<void>((resolve, reject) => {
        request.session.destroy((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      throw new UnauthorizedException('La sesión no es válida.');
    }

    request.usuario = {
      identificacion: user.identificacion,
      correo: user.correo,
      nombres: user.nombres,
      apellidos: user.apellidos,
      rol: user.rol,
    };
    return true;
  }
}
