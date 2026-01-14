import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Address } from './Address';
import { Company } from '../../company/entity/Company';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  @Index('idx_user_company_id')
  companyId: string | null;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  @Column({ name: 'first_name', type: 'varchar', length: 150, nullable: true })
  @Index('idx_user_first_name', ['firstName'])
  firstName?: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 150, nullable: true })
  @Index('idx_user_middle_name', ['middleName'])
  middleName?: string;

  @Column({ name: 'last_name', type: 'varchar', length: 150, nullable: true })
  @Index('idx_user_last_name', ['lastName'])
  lastName?: string;

  @Column({
    name: 'second_last_name',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  secondLastName?: string;

  @Column({ name: 'full_name', type: 'varchar', length: 512, nullable: true })
  @Index('idx_user_full_name', ['fullName'])
  fullName?: string;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  displayName?: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email?: string;

  @Column({ name: 'phone', type: 'varchar', length: 50, nullable: false })
  @Index('idx_user_phone', ['phone'], { unique: true })
  phone: string;

  @Column({
    name: 'password',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  password: string;

  @Column({
    name: 'gender',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  gender?: string;

  @Column({ name: 'group', type: 'varchar', length: 50, nullable: false })
  group: string;

  @Column({ name: 'role', type: 'varchar', length: 20, default: 'user' })
  @Index('idx_user_role')
  role: string;

  @Column({ name: 'permissions', type: 'jsonb', default: () => "'[]'::jsonb" })
  permissions: string[];

  @Column({
    name: 'rfc',
    type: 'varchar',
    length: 13,
    nullable: true,
    unique: true,
  })
  @Index('idx_user_rfc', ['rfc'], {
    unique: true,
    where: `"rfc" IS NOT NULL`,
  })
  rfc?: string;

  @Column({
    name: 'curp',
    type: 'varchar',
    length: 18,
    nullable: true,
    unique: true,
  })
  @Index('idx_user_curp', ['curp'], {
    unique: true,
    where: `"curp" IS NOT NULL`,
  })
  curp?: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: Date;

  @Column({
    name: 'nationality',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  nationality?: string;

  @Column({
    name: 'country_of_birth',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  countryOfBirth?: string;

  @Column({
    name: 'state_of_birth',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  stateOfBirth?: string;

  @Column({ name: 'risk_level', type: 'varchar', length: 50, nullable: true })
  riskLevel?: string;

  @Column({ name: 'profile_completed', type: 'boolean', default: false })
  profileCompleted: boolean;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: false })
  @Index('idx_user_status', ['status'])
  status: string;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];

  @Column({ name: 'verified', type: 'boolean', default: false })
  verified: boolean;

  @Column({ name: 'avatar', type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  lastLogin: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
