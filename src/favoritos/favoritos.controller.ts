import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { SolicitudAutenticada } from '../common/auth.types.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { FavoritosService } from './favoritos.service.js';

@Controller('favoritos')
@UseGuards(SessionAuthGuard)
export class FavoritosController {
  constructor(private readonly service: FavoritosService) {}

  @Get()
  list(@Req() request: SolicitudAutenticada) {
    return this.service.list(request.usuario.identificacion);
  }

  @Post(':idSitio')
  add(
    @Req() request: SolicitudAutenticada,
    @Param('idSitio') idSitio: string,
  ) {
    return this.service.add(request.usuario.identificacion, idSitio);
  }

  @Delete(':idSitio')
  remove(
    @Req() request: SolicitudAutenticada,
    @Param('idSitio') idSitio: string,
  ) {
    return this.service.remove(request.usuario.identificacion, idSitio);
  }
}
