import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  assertAllowedKeys,
  optionalText,
  requireInteger,
  requireObject,
} from '../common/validation.js';
import { Calificacion } from '../database/entities/calificacion.entity.js';
import { SitioTuristico } from '../database/entities/sitioturistico.entity.js';

@Injectable()
export class CalificacionesService {
  constructor(
    @InjectRepository(Calificacion)
    private readonly ratings: Repository<Calificacion>,
    @InjectRepository(SitioTuristico)
    private readonly sites: Repository<SitioTuristico>,
  ) {}

  async list(siteId: number) {
    if (!(await this.sites.exists({ where: { id: siteId } }))) {
      throw new NotFoundException('El sitio turístico no existe.');
    }
    return this.ratings
      .createQueryBuilder('calificacion')
      .leftJoin('usuario', 'usuario', 'usuario.identificacion = calificacion.identificacion')
      .select([
        'calificacion.id AS id',
        'calificacion.puntuacion AS puntuacion',
        'calificacion.comentario AS comentario',
        'calificacion.fecha AS fecha',
        'calificacion.idSitio AS idSitio',
        'usuario.nombres AS nombresUsuario',
        'usuario.apellidos AS apellidosUsuario',
      ])
      .where('calificacion.idSitio = :siteId', { siteId })
      .orderBy('calificacion.fecha', 'DESC')
      .getRawMany();
  }

  async create(
    identificacion: string,
    siteId: number,
    input: unknown,
  ) {
    if (!(await this.sites.exists({ where: { id: siteId } }))) {
      throw new NotFoundException('El sitio turístico no existe.');
    }
    const body = requireObject(input);
    assertAllowedKeys(body, ['puntuacion', 'comentario']);
    const puntuacion = requireInteger(body.puntuacion, 'La puntuación');
    if (puntuacion > 5) {
      throw new BadRequestException('La puntuación debe estar entre 1 y 5.');
    }
    const comentario = optionalText(body.comentario, 'El comentario', 5000);
    const rating = this.ratings.create({
      identificacion,
      idSitio: siteId,
      puntuacion,
      comentario,
      fecha: new Date(),
    });
    return this.ratings.save(rating);
  }

  async remove(
    id: number,
    identificacion: string,
    isAdmin: boolean,
  ) {
    const rating = await this.ratings.findOne({ where: { id } });
    if (!rating) throw new NotFoundException('La calificación no existe.');
    if (rating.identificacion !== identificacion && !isAdmin) {
      throw new ForbiddenException(
        'Solo puedes eliminar tus propias calificaciones.',
      );
    }
    await this.ratings.remove(rating);
    return { mensaje: 'Calificación eliminada.' };
  }
}
