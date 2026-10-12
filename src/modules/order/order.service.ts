import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateId } from '@utils/crypto.util';
import { roundMoney } from '@utils/numeric.util';
import { ORDER_REPOSITORY, ORDER_STATUSES } from './order.constant';
import type { IOrder, IOrderItem, IOrderRepository } from './order.interface';
import { CreateOrderDto } from './dto/createOrder.dto';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async create(dto: CreateOrderDto): Promise<IOrder> {
    const items: IOrderItem[] = dto.items.map((item) => ({
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    const order: IOrder = {
      id: generateId(),
      customerEmail: dto.customerEmail,
      items,
      total: this.calculateTotal(items),
      status: ORDER_STATUSES.PENDING,
      createdAt: new Date(),
    };

    return this.orderRepository.create(order);
  }

  async findAll(): Promise<IOrder[]> {
    return this.orderRepository.findAll();
  }

  async find(id: string): Promise<IOrder> {
    const order = await this.orderRepository.find(id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }

  async cancel(id: string): Promise<IOrder> {
    const order = await this.find(id);
    if (order.status !== ORDER_STATUSES.PENDING) {
      throw new ConflictException(
        `Order ${id} is ${order.status} and can no longer be cancelled`,
      );
    }

    return this.orderRepository.update({
      ...order,
      status: ORDER_STATUSES.CANCELLED,
    });
  }

  async remove(id: string): Promise<void> {
    await this.find(id);
    await this.orderRepository.remove(id);
  }

  private calculateTotal(items: IOrderItem[]): number {
    const total = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    return roundMoney(total);
  }
}
