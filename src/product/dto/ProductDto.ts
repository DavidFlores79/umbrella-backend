// ABOUTME: Response DTO for product data with Swagger documentation.
// ABOUTME: Used to serialize product entities for API responses.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../entity/Product';
import { ProductType, ProductCategory } from '../enum/ProductType';

export class ProductDto {
  @ApiProperty({
    description: 'Product unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID that owns this product',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  companyId: string;

  @ApiProperty({
    description: 'Product SKU',
    example: 'PROD-001',
  })
  sku: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Wireless Mouse',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'High-quality wireless mouse with ergonomic design',
  })
  description: string | null;

  @ApiProperty({
    description: 'Product type',
    enum: ProductType,
    example: ProductType.PRODUCT,
  })
  type: ProductType;

  @ApiProperty({
    description: 'Product category',
    enum: ProductCategory,
    example: ProductCategory.ELECTRONICS,
  })
  category: ProductCategory;

  @ApiProperty({
    description: 'Selling price',
    example: 29.99,
  })
  price: number;

  @ApiProperty({
    description: 'Cost price',
    example: 15.00,
  })
  cost: number;

  @ApiProperty({
    description: 'Tax rate percentage',
    example: 16,
  })
  taxRate: number;

  @ApiPropertyOptional({
    description: 'Unit of measure',
    example: 'pcs',
  })
  unit: string | null;

  @ApiProperty({
    description: 'Track inventory for this product',
    example: true,
  })
  trackInventory: boolean;

  @ApiProperty({
    description: 'Minimum stock level for alerts',
    example: 10,
  })
  minStock: number;

  @ApiPropertyOptional({
    description: 'Maximum stock level',
    example: 1000,
  })
  maxStock: number | null;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/product.png',
  })
  image: string | null;

  @ApiProperty({
    description: 'Whether the product is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  static buildDto(entity: Product): ProductDto {
    const dto = new ProductDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.sku = entity.sku;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.type = entity.type;
    dto.category = entity.category;
    dto.price = Number(entity.price);
    dto.cost = Number(entity.cost);
    dto.taxRate = Number(entity.taxRate);
    dto.unit = entity.unit;
    dto.trackInventory = entity.trackInventory;
    dto.minStock = entity.minStock;
    dto.maxStock = entity.maxStock;
    dto.image = entity.image;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
