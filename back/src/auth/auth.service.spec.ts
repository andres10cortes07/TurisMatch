import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from '../database/entities/usuario.entity.js';
import { AuthService } from './auth.service.js';
import { hashPassword, verifyPassword } from './password.util.js';

describe('AuthService admin user queries', () => {
  let service: AuthService;
  let queryBuilder: {
    addSelect: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    getMany: ReturnType<typeof vi.fn>;
    getOne: ReturnType<typeof vi.fn>;
  };
  let findOne: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const existingPasswordHash = await hashPassword('CurrentPass123');
    queryBuilder = {
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue({
        identificacion: '123',
        tipoDoc: 'CC',
        nombres: 'Ana',
        apellidos: 'Pérez',
        correo: 'ana@example.com',
        fechaNacimiento: '2000-01-01',
        rol: 'turista',
        fechaRegistro: new Date('2026-01-01'),
        contrasena: existingPasswordHash,
      }),
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
    create = vi.fn((user: Usuario) => user);
    save = vi.fn(async (user: Usuario) => user);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: {
            createQueryBuilder: vi.fn(() => queryBuilder),
            findOne,
            create,
            save,
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

  it('creates administrators with a hashed password and never returns it', async () => {
    findOne.mockResolvedValue(null);
    const user = await service.createManagedUser({
      identificacion: '456',
      tipoDoc: 'CC',
      nombres: 'Carlos',
      apellidos: 'Pérez',
      correo: 'carlos@example.com',
      fechaNacimiento: '1990-05-10',
      contrasena: 'ClaveSegura2026',
      rol: 'administrador',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        identificacion: '456',
        correo: 'carlos@example.com',
        rol: 'administrador',
      }),
    );
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0].contrasena).not.toBe('ClaveSegura2026');
    expect(user.rol).toBe('administrador');
    expect(user).not.toHaveProperty('contrasena');
  });

  it('creates tourists when an administrator selects the tourist role', async () => {
    findOne.mockResolvedValue(null);
    const user = await service.createManagedUser({
      identificacion: '789',
      tipoDoc: 'CC',
      nombres: 'María',
      apellidos: 'López',
      correo: 'maria@example.com',
      fechaNacimiento: '1995-06-20',
      contrasena: 'ClaveSegura2026',
      rol: 'turista',
    });

    expect(user.rol).toBe('turista');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'turista' }),
    );
  });

  it('rejects invalid roles when an administrator creates an account', async () => {
    await expect(
      service.createManagedUser({
        identificacion: '789',
        tipoDoc: 'CC',
        nombres: 'María',
        apellidos: 'López',
        correo: 'maria@example.com',
        fechaNacimiento: '1995-06-20',
        contrasena: 'ClaveSegura2026',
        rol: 'superadmin',
      }),
    ).rejects.toThrow('El rol seleccionado no es válido.');
  });

  it('updates basic profile data without changing the account role', async () => {
    const user = await service.updateProfile('123', {
      nombres: 'Ana María',
      apellidos: 'Pérez',
      correo: 'ana.maria@example.com',
    });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'usuario.identificacion = :identificacion',
      { identificacion: '123' },
    );
    expect(save).toHaveBeenCalledOnce();
    expect(user.nombres).toBe('Ana María');
    expect(user.correo).toBe('ana.maria@example.com');
    expect(user.rol).toBe('turista');
    expect(user).not.toHaveProperty('contrasena');
  });

  it('requires the current password to change a password', async () => {
    const user = await service.updateProfile('123', {
      contrasenaActual: 'CurrentPass123',
      contrasena: 'NewSecurePass456',
    });

    expect(queryBuilder.addSelect).toHaveBeenCalledWith('usuario.contrasena');
    expect(await verifyPassword('NewSecurePass456', save.mock.calls[0][0].contrasena)).toBe(true);
    expect(user).not.toHaveProperty('contrasena');
  });

  it('rejects a password change when the current password is incorrect', async () => {
    await expect(
      service.updateProfile('123', {
        contrasenaActual: 'IncorrectPass123',
        contrasena: 'NewSecurePass456',
      }),
    ).rejects.toThrow('La contraseña actual no es correcta.');

    expect(save).not.toHaveBeenCalled();
  });

  it('lets administrators edit user details, role, and reset a password', async () => {
    const user = await service.updateManagedUser(
      '123',
      {
        nombres: 'Ana María',
        rol: 'administrador',
        contrasena: 'TemporaryPass456',
      },
      '999',
    );

    expect(user.nombres).toBe('Ana María');
    expect(user.rol).toBe('administrador');
    expect(await verifyPassword('TemporaryPass456', save.mock.calls[0][0].contrasena)).toBe(true);
    expect(user).not.toHaveProperty('contrasena');
  });

  it('prevents an administrator from removing their own administrator role', async () => {
    await expect(
      service.updateManagedUser(
        '123',
        { rol: 'turista' },
        '123',
      ),
    ).rejects.toThrow(
      'No puedes quitarte a ti mismo el rol de administrador.',
    );

    expect(save).not.toHaveBeenCalled();
  });
});
