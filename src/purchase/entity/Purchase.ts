// ABOUTME: TypeORM entity representing a purchase order in the system.
// ABOUTME: Contains purchase header information with relationship to line items and vendor.

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../company/entity/Company';
import { Vendor } from '../../vendor/entity/Vendor';
import { PurchaseLineItem } from './PurchaseLineItem';
import { PurchaseStatus } from '../enum/PurchaseStatus';

@Entity({ name: 'purchases' })
@Index('idx_purchase_company_po', ['companyId', 'poNumber'], { unique: true })
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index('idx_purchase_company_id')
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  @Index('idx_purchase_vendor_id')
  vendorId: string | null;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor | null;

  @Column({ name: 'po_number', type: 'varchar', length: 50 })
  @Index('idx_purchase_po_number')
  poNumber: string;

  @Column({ name: 'order_date', type: 'date' })
  @Index('idx_purchase_order_date')
  orderDate: Date;

  @Column({ name: 'expected_date', type: 'date', nullable: true })
  expectedDate: Date | null;

  @Column({ name: 'received_date', type: 'date', nullable: true })
  receivedDate: Date | null;

  @Column({ type: 'varchar', length: 20, default: PurchaseStatus.DRAFT })
  @Index('idx_purchase_status')
  status: PurchaseStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => PurchaseLineItem, (lineItem) => lineItem.purchase, { cascade: true })
  lineItems: PurchaseLineItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
