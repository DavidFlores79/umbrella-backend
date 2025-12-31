// ABOUTME: TypeORM entity representing a sale (invoice) in the system.
// ABOUTME: Contains sale header information with relationship to line items and client.

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
import { Client } from '../../client/entity/Client';
import { SaleLineItem } from './SaleLineItem';
import { SaleStatus } from '../enum/SaleStatus';

@Entity({ name: 'sales' })
@Index('idx_sale_company_invoice', ['companyId', 'invoiceNumber'], {
  unique: true,
})
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index('idx_sale_company_id')
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  @Index('idx_sale_client_id')
  clientId: string | null;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client | null;

  @Column({ name: 'invoice_number', type: 'varchar', length: 50 })
  @Index('idx_sale_invoice_number')
  invoiceNumber: string;

  @Column({ name: 'sale_date', type: 'date' })
  @Index('idx_sale_date')
  saleDate: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'varchar', length: 20, default: SaleStatus.DRAFT })
  @Index('idx_sale_status')
  status: SaleStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => SaleLineItem, (lineItem) => lineItem.sale, { cascade: true })
  lineItems: SaleLineItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
