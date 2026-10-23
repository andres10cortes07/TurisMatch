import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { SolicitudAutenticada } from '../common/auth.types.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { AuthService } from '../auth/auth.service.js';

@Controller('usuarios')
@UseGuards(SessionAuthGuard)
export class UsuariosController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  me(@Req() request: SolicitudAutenticada) {
    return this.authService.getProfile(request.usuario.identificacion);
  }

  @Patch('me')
  updateMe(
    @Req() request: SolicitudAutenticada,
    @Body() body: unknown,
  ) {
    return this.authService.updateProfile(
      request.usuario.identificacion,
      body,
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('administrador')
  create(@Body() body: unknown) {
    return this.authService.createManagedUser(body);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('administrador')
  list(@Query('busqueda') search?: string) {
    return this.authService.listUsers(search);
  }

  @Patch(':identificacion')
  @UseGuards(RolesGuard)
  @Roles('administrador')
  update(
    @Param('identificacion') identificacion: string,
    @Body() body: unknown,
    @Req() request: SolicitudAutenticada,
  ) {
    return this.authService.updateManagedUser(
      identificacion,
      body,
      request.usuario.identificacion,
    );
  }

  @Get(':identificacion')
  @UseGuards(RolesGuard)
  @Roles('administrador')
  async get(@Param('identificacion') identificacion: string) {
    const user = await this.authService.findUser(identificacion);
    if (!user) throw new NotFoundException('El usuario no existe.');
    return user;
  }
}
