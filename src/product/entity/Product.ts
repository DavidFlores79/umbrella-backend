// ABOUTME: TypeORM entity representing a product in the company's catalog.
// ABOUTME: Contains product details, pricing, category, and inventory tracking settings.

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../company/entity/Company';
import { ProductType, ProductCategory } from '../enum/ProductType';

@Entity({ name: 'products' })
@Index('idx_product_company_sku', ['companyId', 'sku'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index('idx_product_company_id')
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_product_sku')
  sku: string;

  @Column({ type: 'varchar', length: 255 })
  @Index('idx_product_name')
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: ProductType.PRODUCT,
  })
  @Index('idx_product_type')
  type: ProductType;

  @Column({
    type: 'varchar',
    length: 50,
    default: ProductCategory.OTHER,
  })
  @Index('idx_product_category')
  category: ProductCategory;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cost: number;

  @Column({
    name: 'tax_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  taxRate: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string | null;

  @Column({ name: 'track_inventory', type: 'boolean', default: false })
  trackInventory: boolean;

  @Column({ name: 'min_stock', type: 'int', default: 0 })
  minStock: number;

  @Column({ name: 'max_stock', type: 'int', nullable: true })
  maxStock: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index('idx_product_is_active')
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
