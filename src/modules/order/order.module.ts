import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ORDER_REPOSITORY } from './order.constant';
import { PostgresOrderEntity } from './entities/postgresOrder.entity';
import { PostgresOrderRepository } from './repositories/postgresOrder.repository';
// import { MongoOrderEntity } from './entities/mongoOrder.entity';
// import { MongoOrderRepository } from './repositories/mongoOrder.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostgresOrderEntity]),
    // TypeOrmModule.forFeature([MongoOrderEntity]),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    { provide: ORDER_REPOSITORY, useClass: PostgresOrderRepository },
    // { provide: ORDER_REPOSITORY, useClass: MongoOrderRepository },
  ],
})
export class OrderModule {}
