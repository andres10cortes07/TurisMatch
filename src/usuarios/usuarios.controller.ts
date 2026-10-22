import {
  Body,
  Controller,
  Get,
  Patch,
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

  @Get()
  @UseGuards(RolesGuard)
  @Roles('administrador')
  list() {
    return this.authService.listUsers();
  }
}
