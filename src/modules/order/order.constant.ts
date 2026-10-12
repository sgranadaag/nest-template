export enum ORDER_STATUSES {
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

export const ORDER_ITEM_MAX_QUANTITY = 1000;

export const ORDER_REPOSITORY = Symbol('OrderRepository');
