import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Plan } from '../database/entities/plan.entity.js';
import { SitioTuristico } from '../database/entities/sitioturistico.entity.js';
import { PlanesController } from './planes.controller.js';
import { PlanesService } from './planes.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, SitioTuristico]), AuthModule],
  controllers: [PlanesController],
  providers: [PlanesService],
})
export class PlanesModule {}
