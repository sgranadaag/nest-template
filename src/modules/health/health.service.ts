import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './healthResponse.dto';

@Injectable()
export class HealthService {
  get(): HealthResponseDto {
    return new HealthResponseDto(
      'ok',
      process.uptime(),
      new Date().toISOString(),
    );
  }
}
