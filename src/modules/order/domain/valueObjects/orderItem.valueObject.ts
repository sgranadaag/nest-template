import { ORDER_ITEM_MAX_QUANTITY } from '@modules/order/domain/order.constant';
import type { IOrderItemPrimitives } from '@modules/order/domain/order.interface';

export class OrderItem {
  private constructor(
    private readonly sku: string,
    private readonly quantity: number,
    private readonly unitPrice: number,
  ) {}

  static create(sku: string, quantity: number, unitPrice: number): OrderItem {
    if (!OrderItem.isValid(sku, quantity, unitPrice)) {
      throw new Error(
        `Invalid order item: ${quantity} × ${sku} at ${unitPrice}`,
      );
    }

    return new OrderItem(sku, quantity, unitPrice);
  }

  static isValid(sku: string, quantity: number, unitPrice: number): boolean {
    const hasSku = sku.trim().length > 0;
    const hasValidQuantity =
      Number.isInteger(quantity) &&
      quantity >= 1 &&
      quantity <= ORDER_ITEM_MAX_QUANTITY;
    const hasValidPrice = Number.isFinite(unitPrice) && unitPrice >= 0;

    return hasSku && hasValidQuantity && hasValidPrice;
  }

  getSku(): string {
    return this.sku;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getUnitPrice(): number {
    return this.unitPrice;
  }

  getSubtotal(): number {
    return this.quantity * this.unitPrice;
  }

  toPrimitives(): IOrderItemPrimitives {
    return {
      sku: this.sku,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
    };
  }
}
