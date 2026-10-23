import {
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
import { PlanesService } from './planes.service.js';

@Controller('planes')
export class PlanesController {
  constructor(private readonly service: PlanesService) {}

  @Get()
  list(@Query('idSitio') idSitio?: string) {
    return this.service.list(idSitio);
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
