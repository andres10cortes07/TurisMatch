import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from '../database/entities/usuario.entity.js';
import { AuthService } from './auth.service.js';

describe('AuthService admin user queries', () => {
  let service: AuthService;
  let queryBuilder: {
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    getMany: ReturnType<typeof vi.fn>;
  };
  let findOne: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    queryBuilder = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([
        {
          identificacion: '123',
          tipoDoc: 'CC',
          nombres: 'Ana',
          apellidos: 'Pérez',
          correo: 'ana@example.com',
          fechaNacimiento: '2000-01-01',
          rol: 'turista',
          fechaRegistro: new Date('2026-01-01'),
          contrasena: 'never-return-this',
        },
      ]),
    };
    findOne = vi.fn().mockResolvedValue({
      identificacion: '123',
      tipoDoc: 'CC',
      nombres: 'Ana',
      apellidos: 'Pérez',
      correo: 'ana@example.com',
      fechaNacimiento: '2000-01-01',
      rol: 'turista',
      fechaRegistro: new Date('2026-01-01'),
      contrasena: 'never-return-this',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: {
            createQueryBuilder: vi.fn(() => queryBuilder),
            findOne,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('searches by matching user fields and returns public account data only', async () => {
    const users = await service.listUsers('ana@example.com');

    expect(queryBuilder.where).toHaveBeenCalledWith(
      expect.stringContaining('usuario.correo'),
      { search: '%ana@example.com%' },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'usuario.fechaRegistro',
      'DESC',
    );
    expect(users[0]).not.toHaveProperty('contrasena');
    expect(users[0].correo).toBe('ana@example.com');
  });

  it('returns the public record for an exact identification', async () => {
    const user = await service.findUser('123');

    expect(findOne).toHaveBeenCalledWith({
      where: { identificacion: '123' },
    });
    expect(user).not.toHaveProperty('contrasena');
  });
});
