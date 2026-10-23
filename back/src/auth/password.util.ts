import { BadRequestException } from '@nestjs/common';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';

const KEY_LENGTH = 64;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, saltHex, keyHex, extra] = storedHash.split('$');
  if (
    algorithm !== 'scrypt' ||
    !saltHex ||
    !keyHex ||
    extra !== undefined ||
    !/^[\da-f]+$/i.test(saltHex) ||
    !/^[\da-f]+$/i.test(keyHex)
  ) {
    return false;
  }

  const expected = Buffer.from(keyHex, 'hex');
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await deriveKey(password, Buffer.from(saltHex, 'hex'));
  return timingSafeEqual(actual, expected);
}

export function validatePassword(password: unknown): string {
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 128 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new BadRequestException(
      'La contraseña debe tener de 8 a 128 caracteres e incluir letras y números.',
    );
  }
  return password;
}
