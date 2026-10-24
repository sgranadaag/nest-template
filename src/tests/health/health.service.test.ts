import { HealthService } from '@modules/health/application/health.service';

describe('HealthService', () => {
  describe('get', () => {
    it('reports the app as up', () => {
      const health = new HealthService().get();

      expect(health.getStatus()).toBe('ok');
      expect(health.getUptime()).toBeGreaterThanOrEqual(0);
    });
  });
});
