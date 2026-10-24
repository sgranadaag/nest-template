import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './infrastructure/order.controller';
import { OrderService } from './application/order.service';
import { ORDER_REPOSITORY } from './application/orderRepository.port';
import { PostgresOrderEntity } from './infrastructure/adapters/postgres/postgresOrder.entity';
import { PostgresOrderAdapter } from './infrastructure/adapters/postgres/postgresOrder.adapter';
// import { MongoOrderEntity } from './infrastructure/adapters/mongoOrder.entity';
// import { MongoOrderAdapter } from './infrastructure/adapters/mongoOrder.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostgresOrderEntity]),
    // TypeOrmModule.forFeature([MongoOrderEntity]),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    { provide: ORDER_REPOSITORY, useClass: PostgresOrderAdapter },
    // { provide: ORDER_REPOSITORY, useClass: MongoOrderAdapter },
  ],
})
export class OrderModule {}
