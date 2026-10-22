import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { assertAllowedKeys,
requireObject, requireText } from '../common/validation.js';
import { Categoria } from '../database/entities/categoria.entity.js';
import { SitioTuristico } from '../database/entities/sitioturistico.entity.js';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categories: Repository<Categoria>,
    @InjectRepository(SitioTuristico)
    private readonly sites: Repository<SitioTuristico>,
  ) {}

  list() {
    return this.categories.find({ order: { nombre: 'ASC' } });
  }

  async get(id: number) {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new NotFoundException('La categoría no existe.');
    return category;
  }

  async create(input: unknown) {
    const body = requireObject(input);
    assertAllowedKeys(body, ['nombre', 'descripcion']);
    const nombre = requireText(body.nombre, 'El nombre', 100);
    const descripcion =
      body.descripcion == null
        ? null
        : requireText(body.descripcion, 'La descripción', 255);
    return this.categories.save(this.categories.create({ nombre, descripcion }));
  }

  async update(id: number, input: unknown) {
    const body = requireObject(input);
    assertAllowedKeys(body, ['nombre', 'descripcion']);
    const category = await this.get(id);
    if (body.nombre !== undefined) {
      category.nombre = requireText(body.nombre, 'El nombre', 100);
    }
    if (body.descripcion !== undefined) {
      category.descripcion =
        body.descripcion === null
          ? null
          : requireText(body.descripcion, 'La descripción', 255);
    }
    return this.categories.save(category);
  }

  async remove(id: number) {
    const category = await this.get(id);
    if (await this.sites.exists({ where: { idCategoria: id } })) {
      throw new ConflictException(
        'No se puede eliminar una categoría que tiene sitios asociados.',
      );
    }
    await this.categories.remove(category);
    return { mensaje: 'Categoría eliminada.' };
  }
}
