import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Favorito } from '../database/entities/favorito.entity.js';
import { SitioTuristico } from '../database/entities/sitioturistico.entity.js';
import { FavoritosController } from './favoritos.controller.js';
import { FavoritosService } from './favoritos.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Favorito, SitioTuristico]),
    AuthModule,
  ],
  controllers: [FavoritosController],
  providers: [FavoritosService],
})
export class FavoritosModule {}
