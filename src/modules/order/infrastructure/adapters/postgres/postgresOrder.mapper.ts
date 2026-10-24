import { Order } from '@modules/order/domain/order.entity';
import { OrderItem } from '@modules/order/domain/valueObjects/orderItem.valueObject';
import { PostgresOrderEntity } from './postgresOrder.entity';

export class PostgresOrderMapper {
  static toDomain(entity: PostgresOrderEntity): Order {
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

  static toPersistence(order: Order): PostgresOrderEntity {
    const entity = new PostgresOrderEntity();
    entity.id = order.getId().get();
    entity.customerEmail = order.getCustomerEmail();
    entity.items = order.getItems().map((item) => item.toPrimitives());
    entity.total = order.getTotal();
    entity.status = order.getStatus();
    entity.createdAt = order.getCreatedAt();
    return entity;
  }
}
