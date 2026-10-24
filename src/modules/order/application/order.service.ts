import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order } from '@modules/order/domain/order.entity';
import { OrderItem } from '@modules/order/domain/valueObjects/orderItem.valueObject';
import type { IOrderItemPrimitives } from '@modules/order/domain/order.interface';
import { ORDER_REPOSITORY } from '@modules/order/application/orderRepository.port';
import type { IOrderRepository } from '@modules/order/application/orderRepository.port';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async create(
    customerEmail: string,
    items: IOrderItemPrimitives[],
  ): Promise<Order> {
    const orderItems = items.map((item) =>
      OrderItem.create(item.sku, item.quantity, item.unitPrice),
    );
    const order = Order.create(customerEmail, orderItems);

    return this.orderRepository.save(order);
  }

  async getAll(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async get(id: string): Promise<Order> {
    const order = await this.orderRepository.find(id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }

  async cancel(id: string): Promise<Order> {
    const order = await this.get(id);
    if (!order.canBeCancelled()) {
      throw new ConflictException(
        `Order ${id} is ${order.getStatus()} and can no longer be cancelled`,
      );
    }

    order.cancel();
    return this.orderRepository.save(order);
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    await this.orderRepository.delete(id);
  }
}
