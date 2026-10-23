import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Calificacion } from '../database/entities/calificacion.entity.js';
import { SitioTuristico } from '../database/entities/sitioturistico.entity.js';
import { CalificacionesController } from './calificaciones.controller.js';
import { CalificacionesService } from './calificaciones.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Calificacion, SitioTuristico]),
    AuthModule,
  ],
  controllers: [CalificacionesController],
  providers: [CalificacionesService],
})
export class CalificacionesModule {}
