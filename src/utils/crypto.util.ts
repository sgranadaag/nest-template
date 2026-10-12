import { randomUUID } from 'node:crypto';

/**
 * Generates the id of a new record — the same format on every database engine.
 *
 * @returns A random UUID v4.
 */
export function generateId(): string {
  return randomUUID();
}
