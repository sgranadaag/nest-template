import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Order } from '@modules/order/domain/order.entity';
import type { IOrderRepository } from '@modules/order/application/orderRepository.port';
import { MongoOrderEntity } from './mongoOrder.entity';
import { MongoOrderMapper } from './mongoOrder.mapper';

@Injectable()
export class MongoOrderAdapter implements IOrderRepository {
  constructor(
    @InjectRepository(MongoOrderEntity)
    private readonly repository: MongoRepository<MongoOrderEntity>,
  ) {}

  async save(order: Order): Promise<Order> {
    const document = MongoOrderMapper.toPersistence(order);
    await this.repository.updateOne(
      { id: document.id },
      { $set: document },
      { upsert: true },
    );
    return order;
  }

  async findAll(): Promise<Order[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => MongoOrderMapper.toDomain(entity));
  }

  async find(id: string): Promise<Order | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? MongoOrderMapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.deleteOne({ id });
  }
}
