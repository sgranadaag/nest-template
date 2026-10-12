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
import { OrderService } from './order.service';
import { ORDER_SWAGGER } from './order.swagger';
import { CreateOrderDto } from './dto/createOrder.dto';
import { OrderResponseDto } from './dto/orderResponse.dto';

@ApiTags(ORDER_SWAGGER.API_TAG)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @SwaggerDocs(ORDER_SWAGGER.CREATE, OrderResponseDto)
  @Post()
  async create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    const order = await this.orderService.create(dto);
    return OrderResponseDto.fromOrder(order);
  }

  @SwaggerDocs(ORDER_SWAGGER.FIND_ALL, [OrderResponseDto])
  @Get()
  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.orderService.findAll();
    return orders.map((order) => OrderResponseDto.fromOrder(order));
  }

  @SwaggerDocs(ORDER_SWAGGER.FIND, OrderResponseDto)
  @Get(':id')
  async find(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderService.find(id);
    return OrderResponseDto.fromOrder(order);
  }

  @SwaggerDocs(ORDER_SWAGGER.CANCEL, OrderResponseDto)
  @Patch(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderService.cancel(id);
    return OrderResponseDto.fromOrder(order);
  }

  @SwaggerDocs(ORDER_SWAGGER.REMOVE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.orderService.remove(id);
  }
}
