import { ORDER_STATUSES } from '@modules/order/order.constant';

export interface IOrderItem {
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface IOrder {
  id: string;
  customerEmail: string;
  items: IOrderItem[];
  total: number;
  status: ORDER_STATUSES;
  createdAt: Date;
}

export interface IOrderRepository {
  create(order: IOrder): Promise<IOrder>;
  findAll(): Promise<IOrder[]>;
  find(id: string): Promise<IOrder | null>;
  update(order: IOrder): Promise<IOrder>;
  remove(id: string): Promise<void>;
}
