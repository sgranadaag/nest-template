import { ApiProperty } from '@nestjs/swagger';
import { ORDER_STATUSES } from '@modules/order/order.constant';
import type { IOrder } from '@modules/order/order.interface';
import { ORDER_PROPERTY_SWAGGER } from '@modules/order/order.swagger';
import { OrderItemDto } from './orderItem.dto';

export class OrderResponseDto {
  @ApiProperty(ORDER_PROPERTY_SWAGGER.ID)
  readonly id: string;

  @ApiProperty(ORDER_PROPERTY_SWAGGER.CUSTOMER_EMAIL)
  readonly customerEmail: string;

  @ApiProperty({ ...ORDER_PROPERTY_SWAGGER.ITEMS, type: [OrderItemDto] })
  readonly items: OrderItemDto[];

  @ApiProperty(ORDER_PROPERTY_SWAGGER.TOTAL)
  readonly total: number;

  @ApiProperty(ORDER_PROPERTY_SWAGGER.STATUS)
  readonly status: ORDER_STATUSES;

  @ApiProperty(ORDER_PROPERTY_SWAGGER.CREATED_AT)
  readonly createdAt: string;

  private constructor(order: IOrder) {
    this.id = order.id;
    this.customerEmail = order.customerEmail;
    this.items = order.items;
    this.total = order.total;
    this.status = order.status;
    this.createdAt = order.createdAt.toISOString();
  }

  static fromOrder(order: IOrder): OrderResponseDto {
    return new OrderResponseDto(order);
  }
}
