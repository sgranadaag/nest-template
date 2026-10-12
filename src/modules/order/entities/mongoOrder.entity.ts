import { Column, Entity, ObjectIdColumn } from 'typeorm';
import type { ObjectId } from 'mongodb';
import { ORDER_STATUSES } from '@modules/order/order.constant';
import type { IOrderItem } from '@modules/order/order.interface';

@Entity('orders')
export class MongoOrderEntity {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  customerEmail: string;

  @Column()
  items: IOrderItem[];

  @Column()
  total: number;

  @Column()
  status: ORDER_STATUSES;

  @Column()
  createdAt: Date;
}
