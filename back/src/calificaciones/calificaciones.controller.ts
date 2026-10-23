import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { SolicitudAutenticada } from '../common/auth.types.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { CalificacionesService } from './calificaciones.service.js';

@Controller()
export class CalificacionesController {
  constructor(private readonly service: CalificacionesService) {}

  @Get('sitios/:id/calificaciones')
  list(@Param('id', ParseIntPipe) siteId: number) {
    return this.service.list(siteId);
  }

  @Post('sitios/:id/calificaciones')
  @UseGuards(SessionAuthGuard)
  create(
    @Param('id', ParseIntPipe) siteId: number,
    @Req() request: SolicitudAutenticada,
    @Body() body: unknown,
  ) {
    return this.service.create(
      request.usuario.identificacion,
      siteId,
      body,
    );
  }

  @Delete('calificaciones/:id')
  @UseGuards(SessionAuthGuard)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: SolicitudAutenticada,
  ) {
    return this.service.remove(
      id,
      request.usuario.identificacion,
      request.usuario.rol === 'administrador',
    );
  }
}
