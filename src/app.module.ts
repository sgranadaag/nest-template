import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from '@config/postgres.config';
// import { mongoConfig } from '@config/mongo.config';
import { LoggerMiddleware } from '@middlewares/logger.middleware';
import { HealthModule } from '@modules/health/health.module';
import { OrderModule } from '@modules/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: postgresConfig,
      // useFactory: mongoConfig,
    }),
    HealthModule,
    OrderModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*splat');
  }
}
