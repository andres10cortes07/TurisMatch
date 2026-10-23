
import {
  Body,
  Controller,
  Post,
  BadRequestException,
} from '@nestjs/common';

import { AiService } from './ai.service.js';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
  ) {}

  @Post('search')
  search(@Body() body: {
    query: string;
    filtros?: {
      ciudad?: string;
      categoria?: string;
      calificacionMinima?: number;
      precioMaximo?: number;
    };
  }) {
    if (
      !body ||
      typeof body.query !== 'string' ||
      !body.query.trim()
    ) {
      throw new BadRequestException(
        'Debes escribir una consulta turística.',
      );
    }
    if (
      body.filtros !== undefined &&
      (
        typeof body.filtros !== 'object' ||
        body.filtros === null ||
        Array.isArray(body.filtros)
      )
    ) {
      throw new BadRequestException(
        'Los filtros deben enviarse como un objeto.',
      );
    }

    return this.aiService.processQuery(body.query, body.filtros);
  }
}
