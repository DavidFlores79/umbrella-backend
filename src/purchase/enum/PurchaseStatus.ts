// ABOUTME: Enum defining purchase order status workflow states.
// ABOUTME: Used to track the progress of purchases from draft to received/cancelled.

export enum PurchaseStatus {
  DRAFT = 'draft',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}
