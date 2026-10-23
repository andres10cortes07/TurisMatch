import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Preferencia } from '../database/entities/preferencia.entity.js';
import { UsuarioPreferencia } from '../database/entities/usuario-preferencia.entity.js';
import { PreferenciasController } from './preferencias.controller.js';
import { PreferenciasService } from './preferencias.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Preferencia, UsuarioPreferencia]),
    AuthModule,
  ],
  controllers: [PreferenciasController],
  providers: [PreferenciasService],
})
export class PreferenciasModule {}
