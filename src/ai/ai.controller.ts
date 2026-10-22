
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
  search(@Body() body: { query: string }) {
    if (
      !body ||
      typeof body.query !== 'string' ||
      !body.query.trim()
    ) {
      throw new BadRequestException(
        'Debes escribir una consulta turística.',
      );
    }

    return this.aiService.processQuery(body.query);
  }
}
