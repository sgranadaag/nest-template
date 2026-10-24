import { Order } from '@modules/order/domain/order.entity';

export const ORDER_REPOSITORY = Symbol('OrderRepositoryPort');

export interface IOrderRepository {
  save(order: Order): Promise<Order>;
  findAll(): Promise<Order[]>;
  find(id: string): Promise<Order | null>;
  delete(id: string): Promise<void>;
}
