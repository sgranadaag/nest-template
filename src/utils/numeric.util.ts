const CENTS_PER_UNIT = 100;

/**
 * Rounds an amount of money to two decimals, absorbing floating-point drift.
 *
 * @param amount - The amount to round, e.g. a sum of prices.
 * @returns The amount rounded half-up to the nearest cent.
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * CENTS_PER_UNIT) / CENTS_PER_UNIT;
}
