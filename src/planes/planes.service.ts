import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  assertAllowedKeys,
  optionalInteger,
  optionalText,
  requireInteger,
  requireObject,
  requireNumber,
  requireText,
} from '../common/validation.js';
import { Plan } from '../database/entities/plan.entity.js';
import { SitioTuristico } from '../database/entities/sitioturistico.entity.js';

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(Plan)
    private readonly plans: Repository<Plan>,
    @InjectRepository(SitioTuristico)
    private readonly sites: Repository<SitioTuristico>,
  ) {}

  list(siteId?: string) {
    const query = this.plans.createQueryBuilder('plan');
    if (siteId !== undefined) {
      query.where('plan.idSitio = :siteId', {
        siteId: requireInteger(siteId, 'idSitio'),
      });
    }
    return query.orderBy('plan.precio', 'ASC').getMany();
  }

  async get(id: number) {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('El plan turístico no existe.');
    return plan;
  }

  private async values(input: unknown, current?: Plan) {
    const body = requireObject(input);
    assertAllowedKeys(body, [
      'nombre',
      'descripcion',
      'precio',
      'duracion',
      'cupo',
      'idSitio',
    ]);
    const plan = current ?? this.plans.create();
    if (!current || body.nombre !== undefined) {
      plan.nombre = requireText(body.nombre, 'El nombre', 100);
    }
    if (!current || body.duracion !== undefined) {
      plan.duracion = requireText(body.duracion, 'La duración', 100);
    }
    if (!current || body.precio !== undefined) {
      plan.precio = requireNumber(body.precio, 'El precio', 0).toFixed(2);
    }
    if (!current || body.idSitio !== undefined) {
      plan.idSitio = requireInteger(body.idSitio, 'idSitio');
      if (!(await this.sites.exists({ where: { id: plan.idSitio } }))) {
        throw new NotFoundException('El sitio turístico indicado no existe.');
      }
    }
    if (body.descripcion !== undefined || !current) {
      plan.descripcion = optionalText(
        body.descripcion,
        'La descripción',
        65535,
      );
    }
    if (body.cupo !== undefined || !current) {
      plan.cupo = optionalInteger(body.cupo, 'El cupo', 1);
    }
    return plan;
  }

  async create(input: unknown) {
    return this.plans.save(await this.values(input));
  }

  async update(id: number, input: unknown) {
    const plan = await this.get(id);
    return this.plans.save(await this.values(input, plan));
  }

  async remove(id: number) {
    await this.plans.remove(await this.get(id));
    return { mensaje: 'Plan eliminado.' };
  }
}
