// ABOUTME: Enum defining sale status workflow states.
// ABOUTME: Used to track the progress of sales from draft to paid/cancelled.

export enum SaleStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}
