// ABOUTME: DTO for company settings validation and serialization.
// ABOUTME: Used for updating company settings with proper validation rules.

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Currency, Plan } from '../interface/CompanySettings';

export class CompanySettingsDto {
  @ApiPropertyOptional({
    description: 'Currency code',
    enum: ['USD', 'EUR', 'GBP', 'MXN', 'CAD', 'AUD', 'JPY', 'CHF'],
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'MXN', 'CAD', 'AUD', 'JPY', 'CHF'])
  currency?: Currency;

  @ApiPropertyOptional({
    description: 'Subscription plan',
    enum: ['free', 'basic', 'premium'],
    example: 'free',
  })
  @IsOptional()
  @IsString()
  @IsIn(['free', 'basic', 'premium'])
  plan?: Plan;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Date format',
    example: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({
    description: 'Fiscal year start (MM-DD)',
    example: '01-01',
  })
  @IsOptional()
  @IsString()
  fiscalYearStart?: string;

  @ApiPropertyOptional({
    description: 'Default tax rate (percentage)',
    example: 16,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Invoice number prefix',
    example: 'INV-',
  })
  @IsOptional()
  @IsString()
  invoicePrefix?: string;

  @ApiPropertyOptional({
    description: 'Purchase order number prefix',
    example: 'PO-',
  })
  @IsOptional()
  @IsString()
  purchaseOrderPrefix?: string;

  @ApiPropertyOptional({
    description: 'Allow negative inventory quantities',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  allowNegativeInventory?: boolean;

  @ApiPropertyOptional({
    description: 'Low stock alert threshold',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}
