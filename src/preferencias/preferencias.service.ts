import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  assertAllowedKeys,
  requireInteger,
  requireObject,
  requireText,
} from '../common/validation.js';
import { Preferencia } from '../database/entities/preferencia.entity.js';
import { UsuarioPreferencia } from '../database/entities/usuario-preferencia.entity.js';

@Injectable()
export class PreferenciasService {
  constructor(
    @InjectRepository(Preferencia)
    private readonly preferences: Repository<Preferencia>,
    @InjectRepository(UsuarioPreferencia)
    private readonly userPreferences: Repository<UsuarioPreferencia>,
  ) {}

  list() {
    return this.preferences.find({ order: { nombre: 'ASC' } });
  }

  async get(id: number) {
    const preference = await this.preferences.findOne({ where: { id } });
    if (!preference) throw new NotFoundException('La preferencia no existe.');
    return preference;
  }

  async create(input: unknown) {
    const body = requireObject(input);
    assertAllowedKeys(body, ['nombre', 'descripcion']);
    const nombre = requireText(body.nombre, 'El nombre', 100);
    const descripcion =
      body.descripcion == null
        ? null
        : requireText(body.descripcion, 'La descripción', 255);
    return this.preferences.save(
      this.preferences.create({ nombre, descripcion }),
    );
  }

  async update(id: number, input: unknown) {
    const body = requireObject(input);
    assertAllowedKeys(body, ['nombre', 'descripcion']);
    const preference = await this.preferences.findOne({ where: { id } });
    if (!preference) throw new NotFoundException('La preferencia no existe.');
    if (body.nombre !== undefined) {
      preference.nombre = requireText(body.nombre, 'El nombre', 100);
    }
    if (body.descripcion !== undefined) {
      preference.descripcion =
        body.descripcion === null
          ? null
          : requireText(body.descripcion, 'La descripción', 255);
    }
    return this.preferences.save(preference);
  }

  async remove(id: number) {
    const preference = await this.preferences.findOne({ where: { id } });
    if (!preference) throw new NotFoundException('La preferencia no existe.');
    if (await this.userPreferences.exists({ where: { idPreferencia: id } })) {
      throw new ConflictException(
        'No se puede eliminar una preferencia que ya está asignada.',
      );
    }
    await this.preferences.remove(preference);
    return { mensaje: 'Preferencia eliminada.' };
  }

  async listMine(identificacion: string) {
    const rows = await this.userPreferences.find({
      where: { identificacion },
      order: { idPreferencia: 'ASC' },
    });
    if (!rows.length) return [];
    const ids = rows.map((row) => row.idPreferencia);
    const preferences = await this.preferences
      .createQueryBuilder('preferencia')
      .where('preferencia.id IN (:...ids)', { ids })
      .getMany();
    const byId = new Map(preferences.map((preference) => [preference.id, preference]));
    return rows.map((row) => ({
      ...byId.get(row.idPreferencia),
      nivelInteres: row.nivelInteres,
    }));
  }

  async setMine(
    identificacion: string,
    rawId: string,
    input: unknown,
  ) {
    const idPreferencia = requireInteger(rawId, 'idPreferencia');
    const body = requireObject(input);
    assertAllowedKeys(body, ['nivelInteres']);
    const nivelInteres = requireInteger(body.nivelInteres, 'nivelInteres');
    if (nivelInteres > 5) {
      throw new BadRequestException('nivelInteres debe estar entre 1 y 5.');
    }
    const preference = await this.preferences.findOne({
      where: { id: idPreferencia },
    });
    if (!preference) throw new NotFoundException('La preferencia no existe.');

    await this.userPreferences.save(
      this.userPreferences.create({
        identificacion,
        idPreferencia,
        nivelInteres,
      }),
    );
    return { ...preference, nivelInteres };
  }

  async removeMine(identificacion: string, rawId: string) {
    const idPreferencia = requireInteger(rawId, 'idPreferencia');
    await this.userPreferences.delete({ identificacion, idPreferencia });
    return { mensaje: 'Preferencia personal eliminada.' };
  }
}
