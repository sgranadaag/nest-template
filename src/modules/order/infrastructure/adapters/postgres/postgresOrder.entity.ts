import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ORDER_STATUSES } from '@modules/order/domain/order.constant';
import type { IOrderItemPrimitives } from '@modules/order/domain/order.interface';

@Entity('orders')
export class PostgresOrderEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  customerEmail: string;

  @Column('jsonb')
  items: IOrderItemPrimitives[];

  @Column('double precision')
  total: number;

  @Column({ type: 'varchar' })
  status: ORDER_STATUSES;

  @Column('timestamptz')
  createdAt: Date;
}
