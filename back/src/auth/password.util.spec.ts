import { hashPassword, validatePassword, verifyPassword } from './password.util.js';

describe('password utilities', () => {
  it('hashes passwords and verifies only the matching password', async () => {
    const passwordHash = await hashPassword('TurismoSeguro2026');

    expect(passwordHash.startsWith('scrypt$')).toBe(true);
    await expect(verifyPassword('TurismoSeguro2026', passwordHash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword('otra-clave', passwordHash)).resolves.toBe(
      false,
    );
  });

  it('rejects malformed hashes and weak passwords', async () => {
    await expect(verifyPassword('anything', 'invalid')).resolves.toBe(false);
    expect(() => validatePassword('12345')).toThrow();
    expect(validatePassword('claveSegura8')).toBe('claveSegura8');
  });
});
