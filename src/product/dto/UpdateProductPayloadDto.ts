// ABOUTME: DTO for updating an existing product with validation rules.
// ABOUTME: All fields are optional, includes updatedAt for optimistic locking.

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsUrl,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ProductType, ProductCategory } from '../enum/ProductType';

export class UpdateProductPayloadDto {
  @ApiPropertyOptional({
    description: 'Product SKU (unique per company)',
    example: 'PROD-001',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Wireless Mouse',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'High-quality wireless mouse with ergonomic design',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Product type',
    enum: ProductType,
    example: ProductType.PRODUCT,
  })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({
    description: 'Product category',
    enum: ProductCategory,
    example: ProductCategory.ELECTRONICS,
  })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @ApiPropertyOptional({
    description: 'Selling price',
    example: 29.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Cost price',
    example: 15.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({
    description: 'Tax rate percentage',
    example: 16,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Unit of measure',
    example: 'pcs',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({
    description: 'Track inventory for this product',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum stock level for alerts',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({
    description: 'Maximum stock level',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxStock?: number;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/product.png',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  image?: string;

  @ApiPropertyOptional({
    description: 'Whether the product is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Last updated timestamp for optimistic locking',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}
