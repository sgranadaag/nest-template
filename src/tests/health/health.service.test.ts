import { HealthService } from '@modules/health/health.service';

describe('HealthService', () => {
  describe('get', () => {
    it('reports the app as up', () => {
      const health = new HealthService().get();

      expect(health.status).toBe('ok');
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
