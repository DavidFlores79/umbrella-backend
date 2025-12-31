// ABOUTME: DTO for updating an existing purchase order with validation rules.
// ABOUTME: All fields are optional, includes updatedAt for optimistic locking.

import { ApiPropertyOptional } from '@nestjs/swagger';
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
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseStatus } from '../enum/PurchaseStatus';
import { CreatePurchaseLineItemDto } from './PurchaseLineItemDto';

export class UpdatePurchasePayloadDto {
  @ApiPropertyOptional({
    description: 'Vendor ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional({
    description: 'Order date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({
    description: 'Expected delivery date',
    example: '2024-01-30',
  })
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiPropertyOptional({
    description: 'Received date',
    example: '2024-01-28',
  })
  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 50.00,
    minimum: 0,
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

  @ApiPropertyOptional({
    description: 'Line items (replaces all existing)',
    type: [CreatePurchaseLineItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseLineItemDto)
  lineItems?: CreatePurchaseLineItemDto[];

  @ApiPropertyOptional({
    description: 'Last updated timestamp for optimistic locking',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}

export class UpdatePurchaseStatusDto {
  @ApiPropertyOptional({
    description: 'Purchase status',
    enum: PurchaseStatus,
    example: PurchaseStatus.RECEIVED,
  })
  @IsEnum(PurchaseStatus)
  status: PurchaseStatus;

  @ApiPropertyOptional({
    description: 'Last updated timestamp for optimistic locking',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}
