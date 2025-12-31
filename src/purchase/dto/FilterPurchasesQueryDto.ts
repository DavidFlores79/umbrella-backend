// ABOUTME: Query DTO for filtering and paginating purchases list.
// ABOUTME: Supports filtering by vendor, status, PO number, and date range.

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseStatus } from '../enum/PurchaseStatus';

export class FilterPurchasesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by vendor ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: PurchaseStatus,
    example: PurchaseStatus.ORDERED,
  })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @ApiPropertyOptional({
    description: 'Filter by PO number (partial match)',
    example: 'PO-2024',
  })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by order date from',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  orderDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by order date to',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  orderDateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
