import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LugaresService } from '../lugares/lugares.service.js';
import { AiService } from './ai.service.js';

describe('AiService', () => {
  let service: AiService;
  let obtenerCiudades: ReturnType<typeof vi.fn>;
  let buscarConFiltros: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    obtenerCiudades = vi.fn().mockResolvedValue([]);
    buscarConFiltros = vi.fn().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: { get: vi.fn(() => undefined) },
        },
        {
          provide: LugaresService,
          useValue: { obtenerCiudades, buscarConFiltros },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('combines natural-language interpretation with selected filters', async () => {
    obtenerCiudades.mockResolvedValue(['Tunja', 'Bogotá']);

    const result = await service.processQuery(
      'Quiero viajar con mi pareja a conocer Tunja',
      { calificacionMinima: 4, precioMaximo: 50000 },
    );

    expect(result.filtros).toEqual({
      ciudad: 'Tunja',
      categoria: null,
      calificacionMinima: 4,
      precioMaximo: 50000,
    });
    expect(buscarConFiltros).toHaveBeenCalledWith(
      'Tunja',
      undefined,
      4,
      50000,
    );
  });
});
