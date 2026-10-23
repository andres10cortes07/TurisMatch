import type { Request } from 'express';
import type { RolUsuario } from '../database/entities/usuario.entity.js';

export interface SessionData {
  userId?: string;
}

export interface UsuarioAutenticado {
  identificacion: string;
  correo: string;
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
}

export interface SolicitudAutenticada extends Request {
  usuario: UsuarioAutenticado;
  session: Request['session'] & SessionData;
}
