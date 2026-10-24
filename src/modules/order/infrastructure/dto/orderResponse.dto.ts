import { ApiProperty } from '@nestjs/swagger';
import { ORDER_STATUSES } from '@modules/order/domain/order.constant';
import { Order } from '@modules/order/domain/order.entity';
import { ORDER_PROPERTY_SWAGGER } from '@modules/order/infrastructure/order.swagger';
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

  private constructor(order: Order) {
    this.id = order.getId().get();
    this.customerEmail = order.getCustomerEmail();
    this.items = order.getItems().map((item) => item.toPrimitives());
    this.total = order.getTotal();
    this.status = order.getStatus();
    this.createdAt = order.getCreatedAt().toISOString();
  }

  static fromDomain(order: Order): OrderResponseDto {
    return new OrderResponseDto(order);
  }
}
