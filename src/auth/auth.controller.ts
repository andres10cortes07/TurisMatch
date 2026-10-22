import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { SessionData } from '../common/auth.types.js';
import type { SolicitudAutenticada } from '../common/auth.types.js';
import { SessionAuthGuard } from './session-auth.guard.js';
import { AuthService } from './auth.service.js';

type SolicitudConSesion = Request & {
  session: Request['session'] & SessionData;
};

function regenerateSession(request: SolicitudConSesion): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function saveSession(request: SolicitudConSesion): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function destroySession(request: SolicitudConSesion): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.destroy((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  register(@Body() body: unknown) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(
    @Body() body: unknown,
    @Req() request: SolicitudConSesion,
  ) {
    const usuario = await this.authService.login(body);
    await regenerateSession(request);
    request.session.userId = usuario.identificacion;
    await saveSession(request);
    return { usuario };
  }

  @Post('logout')
  async logout(
    @Req() request: SolicitudConSesion,
    @Res({ passthrough: true }) response: Response,
  ) {
    await destroySession(request);
    response.clearCookie('turismo_sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return { mensaje: 'Sesión cerrada.' };
  }

  @UseGuards(SessionAuthGuard)
  @Get('sesion')
  session(@Req() request: SolicitudAutenticada) {
    return { usuario: request.usuario };
  }
}
