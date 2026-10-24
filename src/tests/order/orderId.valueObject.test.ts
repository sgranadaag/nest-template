import { OrderId } from '@modules/order/domain/valueObjects/orderId.valueObject';

describe('OrderId', () => {
  it('creates a new id on every call', () => {
    expect(OrderId.create().get()).not.toBe(OrderId.create().get());
  });

  it('wraps an existing id unchanged', () => {
    expect(OrderId.from('order-1').get()).toBe('order-1');
  });
});
