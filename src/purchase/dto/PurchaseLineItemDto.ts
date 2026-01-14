// ABOUTME: DTO for purchase line item data with Swagger documentation.
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
import { PurchaseLineItem } from '../entity/PurchaseLineItem';

export class CreatePurchaseLineItemDto {
  @ApiPropertyOptional({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({
    description: 'Line item description',
    example: 'Electronic Components',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 100,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Unit cost',
    example: 5.5,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost: number;

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

export class PurchaseLineItemDto {
  @ApiProperty({
    description: 'Line item unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Purchase ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  purchaseId: string;

  @ApiPropertyOptional({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  productId: string | null;

  @ApiProperty({
    description: 'Line item description',
    example: 'Electronic Components',
  })
  description: string;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 100,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit cost',
    example: 5.5,
  })
  unitCost: number;

  @ApiProperty({
    description: 'Tax rate percentage',
    example: 16,
  })
  taxRate: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 88.0,
  })
  taxAmount: number;

  @ApiProperty({
    description: 'Subtotal (quantity x unitCost)',
    example: 550.0,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Total (subtotal + taxAmount)',
    example: 638.0,
  })
  total: number;

  @ApiProperty({
    description: 'Quantity received',
    example: 50,
  })
  quantityReceived: number;

  static buildDto(entity: PurchaseLineItem): PurchaseLineItemDto {
    const dto = new PurchaseLineItemDto();
    dto.id = entity.id;
    dto.purchaseId = entity.purchaseId;
    dto.productId = entity.productId;
    dto.description = entity.description;
    dto.quantity = Number(entity.quantity);
    dto.unitCost = Number(entity.unitCost);
    dto.taxRate = Number(entity.taxRate);
    dto.taxAmount = Number(entity.taxAmount);
    dto.subtotal = Number(entity.subtotal);
    dto.total = Number(entity.total);
    dto.quantityReceived = Number(entity.quantityReceived);
    return dto;
  }
}
