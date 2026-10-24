import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@modules/order/domain/order.entity';
import type { IOrderRepository } from '@modules/order/application/orderRepository.port';
import { PostgresOrderEntity } from './postgresOrder.entity';
import { PostgresOrderMapper } from './postgresOrder.mapper';

@Injectable()
export class PostgresOrderAdapter implements IOrderRepository {
  constructor(
    @InjectRepository(PostgresOrderEntity)
    private readonly repository: Repository<PostgresOrderEntity>,
  ) {}

  async save(order: Order): Promise<Order> {
    await this.repository.save(PostgresOrderMapper.toPersistence(order));
    return order;
  }

  async findAll(): Promise<Order[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => PostgresOrderMapper.toDomain(entity));
  }

  async find(id: string): Promise<Order | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? PostgresOrderMapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
