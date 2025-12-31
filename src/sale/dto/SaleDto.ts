// ABOUTME: Response DTO for sale data with Swagger documentation.
// ABOUTME: Used to serialize sale entities for API responses including line items.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sale } from '../entity/Sale';
import { SaleStatus } from '../enum/SaleStatus';
import { SaleLineItemDto } from './SaleLineItemDto';

export class SaleDto {
  @ApiProperty({
    description: 'Sale unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  companyId: string;

  @ApiPropertyOptional({
    description: 'Client ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  clientId: string | null;

  @ApiProperty({
    description: 'Invoice number',
    example: 'INV-2024-0001',
  })
  invoiceNumber: string;

  @ApiProperty({
    description: 'Sale date',
    example: '2024-01-15',
  })
  saleDate: Date;

  @ApiPropertyOptional({
    description: 'Due date',
    example: '2024-02-15',
  })
  dueDate: Date | null;

  @ApiProperty({
    description: 'Sale status',
    enum: SaleStatus,
    example: SaleStatus.PENDING,
  })
  status: SaleStatus;

  @ApiProperty({
    description: 'Subtotal before tax and discount',
    example: 100.00,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 16.00,
  })
  taxAmount: number;

  @ApiProperty({
    description: 'Discount amount',
    example: 10.00,
  })
  discount: number;

  @ApiProperty({
    description: 'Total amount',
    example: 106.00,
  })
  total: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Rush order',
  })
  notes: string | null;

  @ApiProperty({
    description: 'Line items',
    type: [SaleLineItemDto],
  })
  lineItems: SaleLineItemDto[];

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

  static buildDto(entity: Sale): SaleDto {
    const dto = new SaleDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.clientId = entity.clientId;
    dto.invoiceNumber = entity.invoiceNumber;
    dto.saleDate = entity.saleDate;
    dto.dueDate = entity.dueDate;
    dto.status = entity.status;
    dto.subtotal = Number(entity.subtotal);
    dto.taxAmount = Number(entity.taxAmount);
    dto.discount = Number(entity.discount);
    dto.total = Number(entity.total);
    dto.notes = entity.notes;
    dto.lineItems = entity.lineItems?.map((item) => SaleLineItemDto.buildDto(item)) || [];
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
