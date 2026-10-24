import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SwaggerDocs } from '@decorators/swaggerDocs.decorator';
import { HealthService } from '@modules/health/application/health.service';
import { HEALTH_SWAGGER } from './health.swagger';
import { HealthResponseDto } from './healthResponse.dto';

@ApiTags(HEALTH_SWAGGER.API_TAG)
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @SwaggerDocs(HEALTH_SWAGGER.GET, HealthResponseDto)
  @Get()
  getHealth(): HealthResponseDto {
    return HealthResponseDto.fromDomain(this.healthService.get());
  }
}
