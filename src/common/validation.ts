import { BadRequestException } from '@nestjs/common';

export function requireText(
  value: unknown,
  field: string,
  maxLength: number,
  minLength = 1,
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length < minLength ||
    value.trim().length > maxLength
  ) {
    throw new BadRequestException(
      `${field} debe tener entre ${minLength} y ${maxLength} caracteres.`,
    );
  }

  return value.trim();
}

export function optionalText(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return requireText(value, field, maxLength);
}

export function requireInteger(
  value: unknown,
  field: string,
  minimum = 1,
): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) {
    throw new BadRequestException(`${field} debe ser un entero válido.`);
  }
  return number;
}

export function optionalInteger(
  value: unknown,
  field: string,
  minimum = 1,
): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return requireInteger(value, field, minimum);
}

export function requireNumber(
  value: unknown,
  field: string,
  minimum: number,
  maximum = Number.POSITIVE_INFINITY,
): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new BadRequestException(`${field} está fuera del rango permitido.`);
  }
  return number;
}

export function optionalNumber(
  value: unknown,
  field: string,
  minimum: number,
  maximum = Number.POSITIVE_INFINITY,
): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return requireNumber(value, field, minimum, maximum);
}

export function requireDate(value: unknown, field: string): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(`${field} debe tener formato YYYY-MM-DD.`);
  }
  return value;
}

export function requireEmail(value: unknown): string {
  const email = requireText(value, 'El correo', 150).toLocaleLowerCase('es-CO');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException('El correo electrónico no es válido.');
  }
  return email;
}

export function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('El cuerpo de la solicitud no es válido.');
  }
  return value as Record<string, unknown>;
}

export function assertAllowedKeys(
  body: Record<string, unknown>,
  allowedKeys: readonly string[],
): void {
  const allowed = new Set(allowedKeys);
  const unexpected = Object.keys(body).find((key) => !allowed.has(key));
  if (unexpected) {
    throw new BadRequestException(`Campo no permitido: "${unexpected}".`);
  }
}
