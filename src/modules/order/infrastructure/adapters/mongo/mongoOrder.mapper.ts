import { Order } from '@modules/order/domain/order.entity';
import { OrderItem } from '@modules/order/domain/valueObjects/orderItem.valueObject';
import { MongoOrderEntity } from './mongoOrder.entity';

export class MongoOrderMapper {
  static toDomain(entity: MongoOrderEntity): Order {
    const items = entity.items.map((item) =>
      OrderItem.create(item.sku, item.quantity, item.unitPrice),
    );

    return Order.reconstitute(
      entity.id,
      entity.customerEmail,
      items,
      entity.status,
      entity.createdAt,
    );
  }

  static toPersistence(order: Order): Omit<MongoOrderEntity, '_id'> {
    return {
      id: order.getId().get(),
      customerEmail: order.getCustomerEmail(),
      items: order.getItems().map((item) => item.toPrimitives()),
      total: order.getTotal(),
      status: order.getStatus(),
      createdAt: order.getCreatedAt(),
    };
  }
}
