import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrderService } from '@modules/order/application/order.service';
import type { IOrderRepository } from '@modules/order/application/orderRepository.port';
import { Order } from '@modules/order/domain/order.entity';
import { ORDER_STATUSES } from '@modules/order/domain/order.constant';
import { OrderItem } from '@modules/order/domain/valueObjects/orderItem.valueObject';

describe('OrderService', () => {
  const buildPendingOrder = (): Order =>
    Order.reconstitute(
      'order-1',
      'jane@example.com',
      [OrderItem.create('SKU-1', 2, 10)],
      ORDER_STATUSES.PENDING,
      new Date('2026-01-01T00:00:00.000Z'),
    );

  let saveMock: jest.Mock;
  let findAllMock: jest.Mock;
  let findMock: jest.Mock;
  let deleteMock: jest.Mock;
  let service: OrderService;

  beforeEach(() => {
    saveMock = jest.fn((order: Order) => Promise.resolve(order));
    findAllMock = jest.fn();
    findMock = jest.fn().mockResolvedValue(null);
    deleteMock = jest.fn().mockResolvedValue(undefined);

    const orderRepository: IOrderRepository = {
      save: saveMock,
      findAll: findAllMock,
      find: findMock,
      delete: deleteMock,
    };

    service = new OrderService(orderRepository);
  });

  describe('create', () => {
    it('persists a pending order built from the given items', async () => {
      const created = await service.create('jane@example.com', [
        { sku: 'SKU-1', quantity: 3, unitPrice: 0.1 },
        { sku: 'SKU-2', quantity: 1, unitPrice: 19.99 },
      ]);

      expect(saveMock).toHaveBeenCalledWith(created);
      expect(created.getStatus()).toBe(ORDER_STATUSES.PENDING);
      expect(created.getTotal()).toBe(20.29);
    });
  });

  describe('getAll', () => {
    it('returns every order from the repository', async () => {
      const orders = [buildPendingOrder()];
      findAllMock.mockResolvedValue(orders);

      const result = await service.getAll();

      expect(result).toBe(orders);
    });
  });

  describe('get', () => {
    it('returns the order from the repository', async () => {
      const order = buildPendingOrder();
      findMock.mockResolvedValue(order);

      const result = await service.get('order-1');

      expect(result).toBe(order);
      expect(findMock).toHaveBeenCalledWith('order-1');
    });

    it('throws NotFoundException when the order does not exist', async () => {
      await expect(service.get('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('cancels a pending order and persists it', async () => {
      findMock.mockResolvedValue(buildPendingOrder());

      const result = await service.cancel('order-1');

      expect(result.getStatus()).toBe(ORDER_STATUSES.CANCELLED);
      expect(saveMock).toHaveBeenCalledWith(result);
    });

    it('throws ConflictException when the order is no longer pending', async () => {
      const order = buildPendingOrder();
      order.cancel();
      findMock.mockResolvedValue(order);

      await expect(service.cancel('order-1')).rejects.toThrow(
        ConflictException,
      );
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the order does not exist', async () => {
      await expect(service.cancel('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deletes an existing order', async () => {
      findMock.mockResolvedValue(buildPendingOrder());

      await service.delete('order-1');

      expect(deleteMock).toHaveBeenCalledWith('order-1');
    });

    it('throws NotFoundException when the order does not exist', async () => {
      await expect(service.delete('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(deleteMock).not.toHaveBeenCalled();
    });
  });
});
