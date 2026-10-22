import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Calificacion } from '../database/entities/calificacion.entity.js';
import { Categoria } from '../database/entities/categoria.entity.js';
import { Favorito } from '../database/entities/favorito.entity.js';
import { Plan } from '../database/entities/plan.entity.js';
import { SitioTuristico } from '../database/entities/sitioturistico.entity.js';
import { Lugar } from '../lugares/lugar.entity.js';
import { SitiosController } from './sitios.controller.js';
import { SitiosService } from './sitios.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SitioTuristico,
      Categoria,
      Plan,
      Calificacion,
      Favorito,
      Lugar,
    ]),
    AuthModule,
  ],
  controllers: [SitiosController],
  providers: [SitiosService],
})
export class SitiosModule {}
