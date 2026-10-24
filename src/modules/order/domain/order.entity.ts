import { roundMoney } from '@utils/numeric.util';
import { ORDER_STATUSES } from '@modules/order/domain/order.constant';
import { OrderId } from '@modules/order/domain/valueObjects/orderId.valueObject';
import { OrderItem } from '@modules/order/domain/valueObjects/orderItem.valueObject';

export class Order {
  private constructor(
    private readonly id: OrderId,
    private readonly customerEmail: string,
    private readonly items: OrderItem[],
    private status: ORDER_STATUSES,
    private readonly createdAt: Date,
  ) {}

  static create(customerEmail: string, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new Error('An order needs at least one item');
    }

    return new Order(
      OrderId.create(),
      customerEmail,
      items,
      ORDER_STATUSES.PENDING,
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    customerEmail: string,
    items: OrderItem[],
    status: ORDER_STATUSES,
    createdAt: Date,
  ): Order {
    return new Order(OrderId.from(id), customerEmail, items, status, createdAt);
  }

  canBeCancelled(): boolean {
    return this.status === ORDER_STATUSES.PENDING;
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error(
        `Order ${this.id.get()} is ${this.status} and can no longer be cancelled`,
      );
    }

    this.status = ORDER_STATUSES.CANCELLED;
  }

  getId(): OrderId {
    return this.id;
  }

  getCustomerEmail(): string {
    return this.customerEmail;
  }

  getItems(): OrderItem[] {
    return [...this.items];
  }

  getTotal(): number {
    const total = this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
    return roundMoney(total);
  }

  getStatus(): ORDER_STATUSES {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
