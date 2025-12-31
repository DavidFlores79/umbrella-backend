// ABOUTME: DTO for creating a new purchase order with validation rules.
// ABOUTME: Contains required and optional fields including line items array.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsUUID,
  IsDateString,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseStatus } from '../enum/PurchaseStatus';
import { CreatePurchaseLineItemDto } from './PurchaseLineItemDto';

export class CreatePurchasePayloadDto {
  @ApiPropertyOptional({
    description: 'Vendor ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({
    description: 'Order date',
    example: '2024-01-15',
  })
  @IsDateString()
  orderDate: string;

  @ApiPropertyOptional({
    description: 'Expected delivery date',
    example: '2024-01-30',
  })
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiPropertyOptional({
    description: 'Purchase status',
    enum: PurchaseStatus,
    example: PurchaseStatus.DRAFT,
    default: PurchaseStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 50.00,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Urgent order - expedite shipping',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Line items',
    type: [CreatePurchaseLineItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseLineItemDto)
  lineItems: CreatePurchaseLineItemDto[];
}
