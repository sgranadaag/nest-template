import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IOrder, IOrderRepository } from '@modules/order/order.interface';
import { PostgresOrderEntity } from '@modules/order/entities/postgresOrder.entity';

@Injectable()
export class PostgresOrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(PostgresOrderEntity)
    private readonly typeOrmRepository: Repository<PostgresOrderEntity>,
  ) {}

  async create(order: IOrder): Promise<IOrder> {
    const saved = await this.typeOrmRepository.save(this.toEntity(order));
    return this.toOrder(saved);
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
    const saved = await this.typeOrmRepository.save(this.toEntity(order));
    return this.toOrder(saved);
  }

  async remove(id: string): Promise<void> {
    await this.typeOrmRepository.delete({ id });
  }

  private toEntity(order: IOrder): PostgresOrderEntity {
    const entity = new PostgresOrderEntity();
    entity.id = order.id;
    entity.customerEmail = order.customerEmail;
    entity.items = order.items;
    entity.total = order.total;
    entity.status = order.status;
    entity.createdAt = order.createdAt;
    return entity;
  }

  private toOrder(entity: PostgresOrderEntity): IOrder {
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
