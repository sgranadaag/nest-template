import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ORDER_STATUSES } from '@modules/order/order.constant';
import type { IOrderItem } from '@modules/order/order.interface';

@Entity('orders')
export class PostgresOrderEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  customerEmail: string;

  @Column('jsonb')
  items: IOrderItem[];

  @Column('double precision')
  total: number;

  @Column({ type: 'varchar' })
  status: ORDER_STATUSES;

  @Column('timestamptz')
  createdAt: Date;
}
