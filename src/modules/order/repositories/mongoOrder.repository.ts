import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import type { IOrder, IOrderRepository } from '@modules/order/order.interface';
import { MongoOrderEntity } from '@modules/order/entities/mongoOrder.entity';

@Injectable()
export class MongoOrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(MongoOrderEntity)
    private readonly typeOrmRepository: MongoRepository<MongoOrderEntity>,
  ) {}

  async create(order: IOrder): Promise<IOrder> {
    await this.typeOrmRepository.insertOne(this.toDocument(order));
    return order;
  }

  async findAll(): Promise<IOrder[]> {
    const entities = await this.typeOrmRepository.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toOrder(entity));
  }

  async find(id: string): Promise<IOrder | null> {
    const entity = await this.typeOrmRepository.findOneBy({ id });
    return entity ? this.toOrder(entity) : null;
  }

  async update(order: IOrder): Promise<IOrder> {
    await this.typeOrmRepository.updateOne(
      { id: order.id },
      { $set: this.toDocument(order) },
    );
    return order;
  }

  async remove(id: string): Promise<void> {
    await this.typeOrmRepository.deleteOne({ id });
  }

  private toDocument(order: IOrder): Omit<MongoOrderEntity, '_id'> {
    return {
      id: order.id,
      customerEmail: order.customerEmail,
      items: order.items,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    };
  }

  private toOrder(entity: MongoOrderEntity): IOrder {
    return {
      id: entity.id,
      customerEmail: entity.customerEmail,
      items: entity.items,
      total: entity.total,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }
}
