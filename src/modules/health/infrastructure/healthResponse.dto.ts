import { ApiProperty } from '@nestjs/swagger';
import { Health } from '@modules/health/domain/health.entity';
import { HEALTH_PROPERTY_SWAGGER } from '@modules/health/infrastructure/health.swagger';

export class HealthResponseDto {
  @ApiProperty(HEALTH_PROPERTY_SWAGGER.STATUS)
  readonly status: string;

  @ApiProperty(HEALTH_PROPERTY_SWAGGER.UPTIME)
  readonly uptime: number;

  @ApiProperty(HEALTH_PROPERTY_SWAGGER.TIMESTAMP)
  readonly timestamp: string;

  private constructor(health: Health) {
    this.status = health.getStatus();
    this.uptime = health.getUptime();
    this.timestamp = health.getTimestamp().toISOString();
  }

  static fromDomain(health: Health): HealthResponseDto {
    return new HealthResponseDto(health);
  }
}
