import { generateId } from '@utils/crypto.util';

export class OrderId {
  private constructor(private readonly value: string) {}

  static create(): OrderId {
    return new OrderId(generateId());
  }

  static from(value: string): OrderId {
    return new OrderId(value);
  }

  get(): string {
    return this.value;
  }
}
