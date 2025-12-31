// ABOUTME: TypeORM entity representing a company (tenant) in the multi-tenant system.
// ABOUTME: Contains company details, settings (JSONB), and status for multi-tenant data isolation.

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  CompanySettings,
  DEFAULT_COMPANY_SETTINGS,
} from '../interface/CompanySettings';

export type CompanyStatus = 'active' | 'inactive' | 'suspended';

@Entity({ name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index('idx_company_name')
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_company_email', { unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ name: 'tax_id', type: 'varchar', length: 50, nullable: true })
  taxId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string | null;

  @Column({ type: 'jsonb', default: () => `'${JSON.stringify(DEFAULT_COMPANY_SETTINGS)}'::jsonb` })
  settings: CompanySettings;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  @Index('idx_company_status')
  status: CompanyStatus;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
