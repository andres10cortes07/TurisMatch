import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LugaresService } from '../lugares/lugares.service.js';
import { AiService } from './ai.service.js';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: { get: vi.fn(() => undefined) },
        },
        {
          provide: LugaresService,
          useValue: { buscarConFiltros: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
