import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { SolicitudAutenticada } from '../common/auth.types.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { PreferenciasService } from './preferencias.service.js';

@Controller('preferencias')
export class PreferenciasController {
  constructor(private readonly service: PreferenciasService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  listMine(@Req() request: SolicitudAutenticada) {
    return this.service.listMine(request.usuario.identificacion);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('administrador')
  create(@Body() body: unknown) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('administrador')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('administrador')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post('me/:idPreferencia')
  @UseGuards(SessionAuthGuard)
  setMine(
    @Req() request: SolicitudAutenticada,
    @Param('idPreferencia') idPreferencia: string,
    @Body() body: unknown,
  ) {
    return this.service.setMine(
      request.usuario.identificacion,
      idPreferencia,
      body,
    );
  }

  @Delete('me/:idPreferencia')
  @UseGuards(SessionAuthGuard)
  removeMine(
    @Req() request: SolicitudAutenticada,
    @Param('idPreferencia') idPreferencia: string,
  ) {
    return this.service.removeMine(
      request.usuario.identificacion,
      idPreferencia,
    );
  }
}
