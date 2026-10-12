import { roundMoney } from '@utils/numeric.util';

describe('roundMoney', () => {
  it.each([
    [0.1 + 0.2, 0.3],
    [19.999, 20],
    [10.004, 10],
    [0, 0],
  ])('rounds %p to %p', (amount, expected) => {
    expect(roundMoney(amount)).toBe(expected);
  });
});
