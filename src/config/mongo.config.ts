import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ENV } from '@constants/environment.constant';

export function mongoConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'mongodb',
    url: configService.get<string>(ENV.MONGO_URI),
    database: configService.get<string>(ENV.MONGO_DATABASE),
    autoLoadEntities: true,
    synchronize: false,
  };
}
