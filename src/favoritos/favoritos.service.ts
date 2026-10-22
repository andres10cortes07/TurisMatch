import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { requireInteger } from '../common/validation.js';
import { Favorito } from '../database/entities/favorito.entity.js';
import { SitioTuristico } from '../database/entities/sitioturistico.entity.js';

@Injectable()
export class FavoritosService {
  constructor(
    @InjectRepository(Favorito)
    private readonly favorites: Repository<Favorito>,
    @InjectRepository(SitioTuristico)
    private readonly sites: Repository<SitioTuristico>,
  ) {}

  async list(identificacion: string) {
    const favorites = await this.favorites.find({
      where: { identificacion },
      order: { id: 'DESC' },
    });
    if (favorites.length === 0) return [];
    const sites = await this.sites.find({
      where: { id: In(favorites.map((favorite) => favorite.idSitio)) },
    });
    const byId = new Map(sites.map((site) => [site.id, site]));
    return favorites.map((favorite) => ({
      id: favorite.id,
      sitio: byId.get(favorite.idSitio),
    }));
  }

  async add(identificacion: string, rawSiteId: string) {
    const idSitio = requireInteger(rawSiteId, 'idSitio');
    if (!(await this.sites.exists({ where: { id: idSitio } }))) {
      throw new NotFoundException('El sitio turístico no existe.');
    }
    const favorite = await this.favorites.findOne({
      where: { identificacion, idSitio },
    });
    if (favorite) return favorite;
    return this.favorites.save(
      this.favorites.create({ identificacion, idSitio }),
    );
  }

  async remove(identificacion: string, rawSiteId: string) {
    const idSitio = requireInteger(rawSiteId, 'idSitio');
    await this.favorites.delete({ identificacion, idSitio });
    return { mensaje: 'Favorito eliminado.' };
  }
}
