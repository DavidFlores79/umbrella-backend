// ABOUTME: DTO for updating an existing sale with validation rules.
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
import { SaleStatus } from '../enum/SaleStatus';
import { CreateSaleLineItemDto } from './SaleLineItemDto';

export class UpdateSalePayloadDto {
  @ApiPropertyOptional({
    description: 'Client ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Sale date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  saleDate?: string;

  @ApiPropertyOptional({
    description: 'Due date',
    example: '2024-02-15',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 10.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Rush order - priority shipping',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Line items (replaces all existing)',
    type: [CreateSaleLineItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleLineItemDto)
  lineItems?: CreateSaleLineItemDto[];

  @ApiPropertyOptional({
    description: 'Last updated timestamp for optimistic locking',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}

export class UpdateSaleStatusDto {
  @ApiPropertyOptional({
    description: 'Sale status',
    enum: SaleStatus,
    example: SaleStatus.PAID,
  })
  @IsEnum(SaleStatus)
  status: SaleStatus;

  @ApiPropertyOptional({
    description: 'Last updated timestamp for optimistic locking',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}
