import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrderService } from '@modules/order/order.service';
import { ORDER_STATUSES } from '@modules/order/order.constant';
import type { IOrder, IOrderRepository } from '@modules/order/order.interface';

describe('OrderService', () => {
  const pendingOrder: IOrder = {
    id: 'order-1',
    customerEmail: 'jane@example.com',
    items: [{ sku: 'SKU-1', quantity: 2, unitPrice: 10 }],
    total: 20,
    status: ORDER_STATUSES.PENDING,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let createMock: jest.Mock;
  let findAllMock: jest.Mock;
  let findMock: jest.Mock;
  let updateMock: jest.Mock;
  let removeMock: jest.Mock;
  let service: OrderService;

  beforeEach(() => {
    createMock = jest.fn((order: IOrder) => Promise.resolve(order));
    findAllMock = jest.fn();
    findMock = jest.fn().mockResolvedValue(null);
    updateMock = jest.fn((order: IOrder) => Promise.resolve(order));
    removeMock = jest.fn().mockResolvedValue(undefined);

    const orderRepository: IOrderRepository = {
      create: createMock,
      findAll: findAllMock,
      find: findMock,
      update: updateMock,
      remove: removeMock,
    };

    service = new OrderService(orderRepository);
  });

  describe('create', () => {
    it('persists a pending order with a generated id and its total', async () => {
      const created = await service.create({
        customerEmail: 'jane@example.com',
        items: [
          { sku: 'SKU-1', quantity: 3, unitPrice: 0.1 },
          { sku: 'SKU-2', quantity: 1, unitPrice: 19.99 },
        ],
      });

      expect(createMock).toHaveBeenCalledWith(created);
      expect(created.id.length).toBeGreaterThan(0);
      expect(created.status).toBe(ORDER_STATUSES.PENDING);
      expect(created.total).toBe(20.29);
    });
  });

  describe('findAll', () => {
    it('returns every order from the repository', async () => {
      findAllMock.mockResolvedValue([pendingOrder]);

      const result = await service.findAll();

      expect(result).toEqual([pendingOrder]);
    });
  });

  describe('find', () => {
    it('returns the order from the repository', async () => {
      findMock.mockResolvedValue(pendingOrder);

      const result = await service.find('order-1');

      expect(result).toBe(pendingOrder);
      expect(findMock).toHaveBeenCalledWith('order-1');
    });

    it('throws NotFoundException when the order does not exist', async () => {
      await expect(service.find('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('moves a pending order to cancelled', async () => {
      findMock.mockResolvedValue(pendingOrder);

      const result = await service.cancel('order-1');

      expect(result.status).toBe(ORDER_STATUSES.CANCELLED);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: ORDER_STATUSES.CANCELLED }),
      );
    });

    it('throws ConflictException when the order is no longer pending', async () => {
      findMock.mockResolvedValue({
        ...pendingOrder,
        status: ORDER_STATUSES.CANCELLED,
      });

      await expect(service.cancel('order-1')).rejects.toThrow(
        ConflictException,
      );
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the order does not exist', async () => {
      await expect(service.cancel('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes an existing order', async () => {
      findMock.mockResolvedValue(pendingOrder);

      await service.remove('order-1');

      expect(removeMock).toHaveBeenCalledWith('order-1');
    });

    it('throws NotFoundException when the order does not exist', async () => {
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(removeMock).not.toHaveBeenCalled();
    });
  });
});
