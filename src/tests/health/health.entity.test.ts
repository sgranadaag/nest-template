import { Health } from '@modules/health/domain/health.entity';

describe('Health', () => {
  it('is ok, with the uptime it was given and the current time', () => {
    const before = Date.now();
    const health = Health.create(12.5);

    expect(health.getStatus()).toBe('ok');
    expect(health.getUptime()).toBe(12.5);
    expect(health.getTimestamp().getTime()).toBeGreaterThanOrEqual(before);
  });
});
