import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SwaggerDocs } from '@decorators/swaggerDocs.decorator';
import { OrderService } from '@modules/order/application/order.service';
import { ORDER_SWAGGER } from './order.swagger';
import { CreateOrderDto } from './dto/createOrder.dto';
import { OrderResponseDto } from './dto/orderResponse.dto';

@ApiTags(ORDER_SWAGGER.API_TAG)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @SwaggerDocs(ORDER_SWAGGER.CREATE, OrderResponseDto)
  @Post()
  async createOrder(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    const items = dto.items.map((item) => ({
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
    const order = await this.orderService.create(dto.customerEmail, items);
    return OrderResponseDto.fromDomain(order);
  }

  @SwaggerDocs(ORDER_SWAGGER.GET_ALL, [OrderResponseDto])
  @Get()
  async getOrders(): Promise<OrderResponseDto[]> {
    const orders = await this.orderService.getAll();
    return orders.map((order) => OrderResponseDto.fromDomain(order));
  }

  @SwaggerDocs(ORDER_SWAGGER.GET, OrderResponseDto)
  @Get(':id')
  async getOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderService.get(id);
    return OrderResponseDto.fromDomain(order);
  }

  @SwaggerDocs(ORDER_SWAGGER.CANCEL, OrderResponseDto)
  @Patch(':id/cancel')
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderService.cancel(id);
    return OrderResponseDto.fromDomain(order);
  }

  @SwaggerDocs(ORDER_SWAGGER.DELETE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOrder(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.orderService.delete(id);
  }
}
