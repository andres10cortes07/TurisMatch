import { Module } from '@nestjs/common';
import { LugaresModule } from '../lugares/lugares.module.js';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';

@Module({
  imports: [LugaresModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
