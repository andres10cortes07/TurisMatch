import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lugar } from './lugar.entity.js';
import { LugaresService } from './lugares.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Lugar])],
  controllers: [],
  providers: [LugaresService],
  exports: [LugaresService],
})
export class LugaresModule {}
