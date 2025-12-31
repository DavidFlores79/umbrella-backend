// ABOUTME: Query DTO for filtering and paginating sales list.
// ABOUTME: Supports filtering by client, status, invoice number, and date range.

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SaleStatus } from '../enum/SaleStatus';

export class FilterSalesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by client ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: SaleStatus,
    example: SaleStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @ApiPropertyOptional({
    description: 'Filter by invoice number (partial match)',
    example: 'INV-2024',
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by sale date from',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  saleDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by sale date to',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  saleDateTo?: string;

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
