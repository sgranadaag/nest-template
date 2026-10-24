import { OrderItem } from '@modules/order/domain/valueObjects/orderItem.valueObject';

describe('OrderItem', () => {
  describe('isValid', () => {
    it.each([
      ['SKU-1', 1, 0, true],
      ['SKU-1', 1000, 99.99, true],
      ['', 1, 1, false],
      ['   ', 1, 1, false],
      ['SKU-1', 0, 1, false],
      ['SKU-1', 1.5, 1, false],
      ['SKU-1', 1001, 1, false],
      ['SKU-1', 1, -1, false],
    ])('%p × %p at %p is valid: %p', (sku, quantity, unitPrice, expected) => {
      expect(OrderItem.isValid(sku, quantity, unitPrice)).toBe(expected);
    });
  });

  describe('create', () => {
    it('creates an item and computes its subtotal', () => {
      const item = OrderItem.create('SKU-1', 3, 2.5);

      expect(item.getSubtotal()).toBe(7.5);
      expect(item.toPrimitives()).toEqual({
        sku: 'SKU-1',
        quantity: 3,
        unitPrice: 2.5,
      });
    });

    it('refuses an invalid item', () => {
      expect(() => OrderItem.create('SKU-1', 0, 1)).toThrow();
    });
  });
});
