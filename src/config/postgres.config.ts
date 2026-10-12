import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ENV } from '@constants/environment.constant';

export function postgresConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>(ENV.POSTGRES_HOST),
    port: Number(configService.get<string>(ENV.POSTGRES_PORT)),
    username: configService.get<string>(ENV.POSTGRES_USER),
    password: configService.get<string>(ENV.POSTGRES_PASSWORD),
    database: configService.get<string>(ENV.POSTGRES_DATABASE),
    autoLoadEntities: true,
    synchronize: false,
  };
}
