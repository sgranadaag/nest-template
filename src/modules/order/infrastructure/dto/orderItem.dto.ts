import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ORDER_ITEM_MAX_QUANTITY } from '@modules/order/domain/order.constant';
import { ORDER_PROPERTY_SWAGGER } from '@modules/order/infrastructure/order.swagger';

export class OrderItemDto {
  @ApiProperty(ORDER_PROPERTY_SWAGGER.SKU)
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty(ORDER_PROPERTY_SWAGGER.QUANTITY)
  @IsInt()
  @Min(1)
  @Max(ORDER_ITEM_MAX_QUANTITY)
  quantity: number;

  @ApiProperty(ORDER_PROPERTY_SWAGGER.UNIT_PRICE)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}
