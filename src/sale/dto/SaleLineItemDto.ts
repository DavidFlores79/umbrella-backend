// ABOUTME: DTO for sale line item data with Swagger documentation.
// ABOUTME: Used for both request payloads and response serialization.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { SaleLineItem } from '../entity/SaleLineItem';

export class CreateSaleLineItemDto {
  @ApiPropertyOptional({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({
    description: 'Line item description',
    example: 'Wireless Mouse',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 2,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Unit price',
    example: 29.99,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Tax rate percentage',
    example: 16,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRate?: number;
}

export class SaleLineItemDto {
  @ApiProperty({
    description: 'Line item unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Sale ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  saleId: string;

  @ApiPropertyOptional({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  productId: string | null;

  @ApiProperty({
    description: 'Line item description',
    example: 'Wireless Mouse',
  })
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit price',
    example: 29.99,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'Tax rate percentage',
    example: 16,
  })
  taxRate: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 9.6,
  })
  taxAmount: number;

  @ApiProperty({
    description: 'Subtotal (quantity x unitPrice)',
    example: 59.98,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Total (subtotal + taxAmount)',
    example: 69.58,
  })
  total: number;

  static buildDto(entity: SaleLineItem): SaleLineItemDto {
    const dto = new SaleLineItemDto();
    dto.id = entity.id;
    dto.saleId = entity.saleId;
    dto.productId = entity.productId;
    dto.description = entity.description;
    dto.quantity = Number(entity.quantity);
    dto.unitPrice = Number(entity.unitPrice);
    dto.taxRate = Number(entity.taxRate);
    dto.taxAmount = Number(entity.taxAmount);
    dto.subtotal = Number(entity.subtotal);
    dto.total = Number(entity.total);
    return dto;
  }
}
