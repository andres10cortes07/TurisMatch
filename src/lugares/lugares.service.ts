
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lugar } from './lugar.entity.js';

@Injectable()
export class LugaresService {
  constructor(
    @InjectRepository(Lugar)
    private readonly lugaresRepository: Repository<Lugar>,
  ) {}

  // Obtener todos los lugares turísticos
  async obtenerTodos(): Promise<Lugar[]> {
    return this.lugaresRepository.find({
      order: {
        calificacion: 'DESC',
      },
    });
  }

  // Buscar lugares por ciudad
  async buscarPorCiudad(ciudad: string): Promise<Lugar[]> {
    return this.lugaresRepository
      .createQueryBuilder('lugar')
      .where('LOWER(lugar.ciudad) = LOWER(:ciudad)', {
        ciudad,
      })
      .orderBy('lugar.calificacion', 'DESC')
      .getMany();
  }

  // Buscar lugares aplicando filtros opcionales
  async buscarConFiltros(
    ciudad?: string,
    categoria?: string,
    calificacionMinima?: number,
    precioMaximo?: number,
  ): Promise<Lugar[]> {
    const consulta = this.lugaresRepository
      .createQueryBuilder('lugar');

    if (ciudad?.trim()) {
      consulta.andWhere(
        'LOWER(lugar.ciudad) LIKE LOWER(:ciudad)',
        { ciudad: `%${ciudad.trim()}%` },
      );
    }

    if (categoria?.trim()) {
      consulta.andWhere(
        'LOWER(lugar.categoria) LIKE LOWER(:categoria)',
        { categoria: `%${categoria.trim()}%` },
      );
    }

    if (calificacionMinima !== undefined) {
      consulta.andWhere(
        'lugar.calificacion >= :calificacionMinima',
        { calificacionMinima },
      );
    }

    if (precioMaximo !== undefined) {
      consulta.andWhere(
        'lugar.precio <= :precioMaximo',
        { precioMaximo },
      );
    }

    return consulta
      .orderBy('lugar.calificacion', 'DESC')
      .getMany();
  }
}
