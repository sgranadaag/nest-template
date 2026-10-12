import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { ORDER_PROPERTY_SWAGGER } from '@modules/order/order.swagger';
import { OrderItemDto } from './orderItem.dto';

export class CreateOrderDto {
  @ApiProperty(ORDER_PROPERTY_SWAGGER.CUSTOMER_EMAIL)
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ ...ORDER_PROPERTY_SWAGGER.ITEMS, type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
