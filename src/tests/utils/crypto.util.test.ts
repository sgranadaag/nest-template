import { generateId } from '@utils/crypto.util';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateId', () => {
  it('returns a UUID v4', () => {
    expect(generateId()).toMatch(UUID_V4);
  });

  it('returns a different value on every call', () => {
    expect(generateId()).not.toBe(generateId());
  });
});
