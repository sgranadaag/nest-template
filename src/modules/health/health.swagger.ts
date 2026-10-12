import type { ApiPropertyOptions } from '@nestjs/swagger';

export const HEALTH_SWAGGER = {
  API_TAG: 'Health',

  GET: {
    operation: {
      summary: 'Check the service is up',
      description: 'Answers without touching the database.',
    },
    responses: {
      200: { description: 'The service is up.' },
    },
  },
} as const;

export const HEALTH_PROPERTY_SWAGGER = {
  STATUS: {
    description: 'Always `ok` when the service answers.',
    example: 'ok',
  },
  UPTIME: { description: 'Seconds since the process started.', example: 42.5 },
  TIMESTAMP: {
    description: 'Server time of the answer (ISO 8601).',
    example: '2026-01-01T00:00:00.000Z',
  },
} satisfies Record<string, ApiPropertyOptions>;
