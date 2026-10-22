import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  optionalNumber,
  optionalText,
  requireInteger,
  requireObject,
  requireText,
} from '../common/validation.js';
import { Categoria } from '../database/entities/categoria.entity.js';
import { Calificacion } from '../database/entities/calificacion.entity.js';
import { Favorito } from '../database/entities/favorito.entity.js';
import { Plan } from '../database/entities/plan.entity.js';
import { SitioTuristico } from '../database/entities/sitioturistico.entity.js';
import { Lugar } from '../lugares/lugar.entity.js';

@Injectable()
export class SitiosService {
  constructor(
    @InjectRepository(SitioTuristico)
    private readonly sites: Repository<SitioTuristico>,
    @InjectRepository(Categoria)
    private readonly categories: Repository<Categoria>,
    @InjectRepository(Plan)
    private readonly plans: Repository<Plan>,
    @InjectRepository(Calificacion)
    private readonly ratings: Repository<Calificacion>,
    @InjectRepository(Favorito)
    private readonly favorites: Repository<Favorito>,
    @InjectRepository(Lugar)
    private readonly places: Repository<Lugar>,
  ) {}

  list(filters: {
    ciudad?: string;
    categoriaId?: string;
    categoria?: string;
    calificacionMinima?: string;
    precioMaximo?: string;
  }) {
    const query = this.places.createQueryBuilder('sitio');
    if (filters.ciudad?.trim()) {
      query.andWhere('LOWER(sitio.ciudad) LIKE LOWER(:ciudad)', {
        ciudad: `%${filters.ciudad.trim()}%`,
      });
    }
    if (filters.categoriaId !== undefined) {
      query.andWhere('sitio.idCategoria = :categoriaId', {
        categoriaId: requireInteger(filters.categoriaId, 'categoriaId'),
      });
    }
    if (filters.categoria?.trim()) {
      query.andWhere('LOWER(sitio.categoria) LIKE LOWER(:categoria)', {
        categoria: `%${filters.categoria.trim()}%`,
      });
    }
    if (filters.calificacionMinima !== undefined) {
      const minima = Number(filters.calificacionMinima);
      if (!Number.isFinite(minima) || minima < 0 || minima > 5) {
        throw new BadRequestException(
          'La calificación mínima debe estar entre 0 y 5.',
        );
      }
      query.andWhere('sitio.calificacion >= :minima', { minima });
    }
    if (filters.precioMaximo !== undefined) {
      const maximo = Number(filters.precioMaximo);
      if (!Number.isFinite(maximo) || maximo < 0) {
        throw new BadRequestException(
          'El precio máximo debe ser mayor o igual a cero.',
        );
      }
      query.andWhere('sitio.precio <= :maximo', { maximo });
    }
    return query.orderBy('sitio.calificacion', 'DESC').getMany();
  }

  async get(id: number) {
    const place = await this.places.findOne({ where: { id } });
    if (!place) throw new NotFoundException('El sitio turístico no existe.');
    const [site, categoriaInfo, planes, promedio, cantidad] = await Promise.all([
      this.sites.findOne({ where: { id } }),
      this.categories.findOne({ where: { id: place.idCategoria } }),
      this.plans.find({
        where: { idSitio: id },
        order: { precio: 'ASC' },
      }),
      this.ratings
        .createQueryBuilder('calificacion')
        .select('ROUND(AVG(calificacion.puntuacion), 1)', 'promedio')
        .where('calificacion.idSitio = :id', { id })
        .getRawOne<{ promedio: string | null }>(),
      this.ratings.count({ where: { idSitio: id } }),
    ]);
    return {
      ...place,
      horario: site?.horario ?? null,
      categoriaInfo,
      planes,
      calificacionPromedio: Number(promedio?.promedio ?? 0),
      cantidadCalificaciones: cantidad,
    };
  }

  private async categoryExists(id: number) {
    if (!(await this.categories.exists({ where: { id } }))) {
      throw new NotFoundException('La categoría indicada no existe.');
    }
  }

  private async values(input: unknown, current?: SitioTuristico) {
    const body = requireObject(input);
    const allowed = new Set([
      'nombre',
      'descripcion',
      'ubicacion',
      'ciudad',
      'imagen',
      'horario',
      'idCategoria',
      'latitud',
      'longitud',
    ]);
    const unexpected = Object.keys(body).find((key) => !allowed.has(key));
    if (unexpected) {
      throw new BadRequestException(`Campo no permitido: "${unexpected}".`);
    }
    const site = current ?? this.sites.create();
    if (!current || body.nombre !== undefined) {
      site.nombre = requireText(body.nombre, 'El nombre', 150);
    }
    if (!current || body.ubicacion !== undefined) {
      site.ubicacion = requireText(body.ubicacion, 'La ubicación', 255);
    }
    if (!current || body.ciudad !== undefined) {
      site.ciudad = requireText(body.ciudad, 'La ciudad', 100);
    }
    if (!current || body.idCategoria !== undefined) {
      site.idCategoria = requireInteger(body.idCategoria, 'idCategoria');
      await this.categoryExists(site.idCategoria);
    }
    if (body.descripcion !== undefined || !current) {
      site.descripcion = optionalText(body.descripcion, 'La descripción', 65535);
    }
    if (body.imagen !== undefined || !current) {
      site.imagen = optionalText(body.imagen, 'La imagen', 500);
    }
    if (body.horario !== undefined || !current) {
      site.horario = optionalText(body.horario, 'El horario', 255);
    }
    if (body.latitud !== undefined || !current) {
      const value = optionalNumber(body.latitud, 'La latitud', -90, 90);
      site.latitud = value === null ? null : value.toFixed(7);
    }
    if (body.longitud !== undefined || !current) {
      const value = optionalNumber(body.longitud, 'La longitud', -180, 180);
      site.longitud = value === null ? null : value.toFixed(7);
    }
    return site;
  }

  async create(input: unknown) {
    return this.sites.save(await this.values(input));
  }

  async update(id: number, input: unknown) {
    const site = await this.sites.findOne({ where: { id } });
    if (!site) throw new NotFoundException('El sitio turístico no existe.');
    return this.sites.save(await this.values(input, site));
  }

  async remove(id: number) {
    const site = await this.sites.findOne({ where: { id } });
    if (!site) throw new NotFoundException('El sitio turístico no existe.');
    if (
      (await this.plans.exists({ where: { idSitio: id } })) ||
      (await this.ratings.exists({ where: { idSitio: id } })) ||
      (await this.favorites.exists({ where: { idSitio: id } }))
    ) {
      throw new ConflictException(
        'No se puede eliminar un sitio con planes, calificaciones o favoritos asociados.',
      );
    }
    await this.sites.remove(site);
    return { mensaje: 'Sitio turístico eliminado.' };
  }
}
