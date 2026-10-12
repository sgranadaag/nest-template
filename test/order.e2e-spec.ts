import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/middlewares/httpException.filter';

const NON_EXISTENT_ID = '00000000-0000-4000-8000-000000000000';

const NEW_ORDER = {
  customerEmail: 'jane@example.com',
  items: [
    { sku: 'SKU-1', quantity: 2, unitPrice: 10.5 },
    { sku: 'SKU-2', quantity: 1, unitPrice: 4 },
  ],
};

describe('Order (e2e)', () => {
  let app: INestApplication<App>;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await request(app.getHttpServer()).delete(`/orders/${id}`);
    }
    await app.close();
  });

  it('creates, lists, fetches, cancels and deletes an order', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/orders')
      .send(NEW_ORDER)
      .expect(201);

    expect(createResponse.body).toMatchObject({
      customerEmail: NEW_ORDER.customerEmail,
      total: 25,
      status: 'pending',
    });
    const { id } = createResponse.body as { id: string };
    createdIds.push(id);

    const listResponse = await request(app.getHttpServer())
      .get('/orders')
      .expect(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id })]),
    );

    await request(app.getHttpServer()).get(`/orders/${id}`).expect(200);

    const cancelResponse = await request(app.getHttpServer())
      .patch(`/orders/${id}/cancel`)
      .expect(200);
    expect(cancelResponse.body).toMatchObject({ id, status: 'cancelled' });

    await request(app.getHttpServer())
      .patch(`/orders/${id}/cancel`)
      .expect(409);

    await request(app.getHttpServer()).delete(`/orders/${id}`).expect(204);
    createdIds.pop();

    await request(app.getHttpServer()).get(`/orders/${id}`).expect(404);
  });

  it('rejects an order without items', () => {
    return request(app.getHttpServer())
      .post('/orders')
      .send({ customerEmail: 'jane@example.com', items: [] })
      .expect(400);
  });

  it('rejects an item with a non-positive quantity', () => {
    return request(app.getHttpServer())
      .post('/orders')
      .send({
        customerEmail: 'jane@example.com',
        items: [{ sku: 'SKU-1', quantity: 0, unitPrice: 1 }],
      })
      .expect(400);
  });

  it('answers 404 for an order that does not exist', () => {
    return request(app.getHttpServer())
      .get(`/orders/${NON_EXISTENT_ID}`)
      .expect(404);
  });
});
