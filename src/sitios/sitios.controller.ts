import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { SitiosService } from './sitios.service.js';

@Controller('sitios')
export class SitiosController {
  constructor(private readonly service: SitiosService) {}

  @Get()
  list(
    @Query('ciudad') ciudad?: string,
    @Query('categoriaId') categoriaId?: string,
    @Query('categoria') categoria?: string,
    @Query('calificacionMinima') calificacionMinima?: string,
    @Query('precioMaximo') precioMaximo?: string,
  ) {
    return this.service.list({
      ciudad,
      categoriaId,
      categoria,
      calificacionMinima,
      precioMaximo,
    });
  }

  @Get('buscar')
  searchByCity(@Query('ciudad') ciudad?: string) {
    if (!ciudad?.trim()) {
      throw new BadRequestException('Debes proporcionar una ciudad.');
    }
    return this.service.list({ ciudad });
  }

  @Get('filtrar')
  filter(
    @Query('ciudad') ciudad?: string,
    @Query('categoria') categoria?: string,
    @Query('calificacionMinima') calificacionMinima?: string,
    @Query('precioMaximo') precioMaximo?: string,
  ) {
    return this.service.list({
      ciudad,
      categoria,
      calificacionMinima,
      precioMaximo,
    });
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
}
