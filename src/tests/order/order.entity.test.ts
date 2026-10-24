import { Order } from '@modules/order/domain/order.entity';
import { ORDER_STATUSES } from '@modules/order/domain/order.constant';
import { OrderItem } from '@modules/order/domain/valueObjects/orderItem.valueObject';

describe('Order', () => {
  const items = [
    OrderItem.create('SKU-1', 2, 10.5),
    OrderItem.create('SKU-2', 1, 4),
  ];

  describe('create', () => {
    it('creates a pending order with a generated id', () => {
      const order = Order.create('jane@example.com', items);

      expect(order.getId().get().length).toBeGreaterThan(0);
      expect(order.getStatus()).toBe(ORDER_STATUSES.PENDING);
      expect(order.getItems()).toHaveLength(2);
    });

    it('refuses an order without items', () => {
      expect(() => Order.create('jane@example.com', [])).toThrow();
    });
  });

  describe('reconstitute', () => {
    it('rebuilds an order with its known id and status', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const order = Order.reconstitute(
        'order-1',
        'jane@example.com',
        items,
        ORDER_STATUSES.CANCELLED,
        createdAt,
      );

      expect(order.getId().get()).toBe('order-1');
      expect(order.getStatus()).toBe(ORDER_STATUSES.CANCELLED);
      expect(order.getCreatedAt()).toBe(createdAt);
    });
  });

  describe('getTotal', () => {
    it('sums every item and rounds to cents', () => {
      const order = Order.create('jane@example.com', [
        OrderItem.create('SKU-1', 3, 0.1),
        OrderItem.create('SKU-2', 1, 19.99),
      ]);

      expect(order.getTotal()).toBe(20.29);
    });
  });

  describe('cancel', () => {
    it('moves a pending order to cancelled', () => {
      const order = Order.create('jane@example.com', items);

      order.cancel();

      expect(order.getStatus()).toBe(ORDER_STATUSES.CANCELLED);
      expect(order.canBeCancelled()).toBe(false);
    });

    it('refuses to cancel an order that is no longer pending', () => {
      const order = Order.create('jane@example.com', items);
      order.cancel();

      expect(() => order.cancel()).toThrow();
    });
  });

  describe('getItems', () => {
    it('returns a copy, so the aggregate cannot be changed from outside', () => {
      const order = Order.create('jane@example.com', items);

      order.getItems().pop();

      expect(order.getItems()).toHaveLength(2);
    });
  });
});
