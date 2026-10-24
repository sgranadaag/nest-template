import { Column, Entity, ObjectIdColumn } from 'typeorm';
import type { ObjectId } from 'mongodb';
import { ORDER_STATUSES } from '@modules/order/domain/order.constant';
import type { IOrderItemPrimitives } from '@modules/order/domain/order.interface';

@Entity('orders')
export class MongoOrderEntity {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;

  @Column()
  customerEmail: string;

  @Column()
  items: IOrderItemPrimitives[];

  @Column()
  total: number;

  @Column()
  status: ORDER_STATUSES;

  @Column()
  createdAt: Date;
}
