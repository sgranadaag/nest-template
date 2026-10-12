import { MigrationInterface, QueryRunner } from 'typeorm';
import type { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';

const ORDERS = 'orders';
const ORDERS_ID_INDEX = 'orders_id_unique';
const ORDERS_CREATED_AT_INDEX = 'orders_createdAt_desc';

export class CreateOrdersIndexes1790000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const mongoQueryRunner = queryRunner as MongoQueryRunner;

    await mongoQueryRunner.createCollectionIndex(
      ORDERS,
      { id: 1 },
      { name: ORDERS_ID_INDEX, unique: true },
    );
    await mongoQueryRunner.createCollectionIndex(
      ORDERS,
      { createdAt: -1 },
      { name: ORDERS_CREATED_AT_INDEX },
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const mongoQueryRunner = queryRunner as MongoQueryRunner;

    await mongoQueryRunner.dropCollectionIndex(ORDERS, ORDERS_CREATED_AT_INDEX);
    await mongoQueryRunner.dropCollectionIndex(ORDERS, ORDERS_ID_INDEX);
  }
}
