import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTable1790000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid PRIMARY KEY,
        "customerEmail" varchar NOT NULL,
        "items" jsonb NOT NULL,
        "total" double precision NOT NULL,
        "status" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "orders"`);
  }
}
