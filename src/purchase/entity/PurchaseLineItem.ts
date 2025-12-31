// ABOUTME: TypeORM entity representing a line item in a purchase order.
// ABOUTME: Contains product, quantity, price, and calculated amounts for each purchase line.

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Purchase } from './Purchase';
import { Product } from '../../product/entity/Product';

@Entity({ name: 'purchase_line_items' })
export class PurchaseLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_id', type: 'uuid' })
  @Index('idx_purchase_line_item_purchase_id')
  purchaseId: string;

  @ManyToOne(() => Purchase, (purchase) => purchase.lineItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  @Index('idx_purchase_line_item_product_id')
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 1 })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitCost: number;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'quantity_received', type: 'decimal', precision: 12, scale: 4, default: 0 })
  quantityReceived: number;
}
