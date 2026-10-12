import { ApiProperty } from '@nestjs/swagger';
import { HEALTH_PROPERTY_SWAGGER } from '@modules/health/health.swagger';

export class HealthResponseDto {
  @ApiProperty(HEALTH_PROPERTY_SWAGGER.STATUS)
  readonly status: string;

  @ApiProperty(HEALTH_PROPERTY_SWAGGER.UPTIME)
  readonly uptime: number;

  @ApiProperty(HEALTH_PROPERTY_SWAGGER.TIMESTAMP)
  readonly timestamp: string;

  constructor(status: string, uptime: number, timestamp: string) {
    this.status = status;
    this.uptime = uptime;
    this.timestamp = timestamp;
  }
}
