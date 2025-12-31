// ABOUTME: DTO for creating a new sale with validation rules.
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
import { SaleStatus } from '../enum/SaleStatus';
import { CreateSaleLineItemDto } from './SaleLineItemDto';

export class CreateSalePayloadDto {
  @ApiPropertyOptional({
    description: 'Client ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({
    description: 'Sale date',
    example: '2024-01-15',
  })
  @IsDateString()
  saleDate: string;

  @ApiPropertyOptional({
    description: 'Due date',
    example: '2024-02-15',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Sale status',
    enum: SaleStatus,
    example: SaleStatus.DRAFT,
    default: SaleStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 10.00,
    minimum: 0,
    default: 0,
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

  @ApiProperty({
    description: 'Line items',
    type: [CreateSaleLineItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleLineItemDto)
  lineItems: CreateSaleLineItemDto[];
}
