import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Categoria } from '../database/entities/categoria.entity.js';
import { SitioTuristico } from '../database/entities/sitioturistico.entity.js';
import { CategoriasController } from './categorias.controller.js';
import { CategoriasService } from './categorias.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Categoria, SitioTuristico]),
    AuthModule,
  ],
  controllers: [CategoriasController],
  providers: [CategoriasService],
})
export class CategoriasModule {}
