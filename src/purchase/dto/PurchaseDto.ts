// ABOUTME: Response DTO for purchase data with Swagger documentation.
// ABOUTME: Used to serialize purchase entities for API responses including line items.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Purchase } from '../entity/Purchase';
import { PurchaseStatus } from '../enum/PurchaseStatus';
import { PurchaseLineItemDto } from './PurchaseLineItemDto';

export class PurchaseDto {
  @ApiProperty({
    description: 'Purchase unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  companyId: string;

  @ApiPropertyOptional({
    description: 'Vendor ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  vendorId: string | null;

  @ApiProperty({
    description: 'Purchase order number',
    example: 'PO-2024-0001',
  })
  poNumber: string;

  @ApiProperty({
    description: 'Order date',
    example: '2024-01-15',
  })
  orderDate: Date;

  @ApiPropertyOptional({
    description: 'Expected delivery date',
    example: '2024-01-30',
  })
  expectedDate: Date | null;

  @ApiPropertyOptional({
    description: 'Received date',
    example: '2024-01-28',
  })
  receivedDate: Date | null;

  @ApiProperty({
    description: 'Purchase status',
    enum: PurchaseStatus,
    example: PurchaseStatus.ORDERED,
  })
  status: PurchaseStatus;

  @ApiProperty({
    description: 'Subtotal before tax and discount',
    example: 500.0,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 80.0,
  })
  taxAmount: number;

  @ApiProperty({
    description: 'Discount amount',
    example: 50.0,
  })
  discount: number;

  @ApiProperty({
    description: 'Total amount',
    example: 530.0,
  })
  total: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Urgent order',
  })
  notes: string | null;

  @ApiProperty({
    description: 'Line items',
    type: [PurchaseLineItemDto],
  })
  lineItems: PurchaseLineItemDto[];

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

  static buildDto(entity: Purchase): PurchaseDto {
    const dto = new PurchaseDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.vendorId = entity.vendorId;
    dto.poNumber = entity.poNumber;
    dto.orderDate = entity.orderDate;
    dto.expectedDate = entity.expectedDate;
    dto.receivedDate = entity.receivedDate;
    dto.status = entity.status;
    dto.subtotal = Number(entity.subtotal);
    dto.taxAmount = Number(entity.taxAmount);
    dto.discount = Number(entity.discount);
    dto.total = Number(entity.total);
    dto.notes = entity.notes;
    dto.lineItems =
      entity.lineItems?.map((item) => PurchaseLineItemDto.buildDto(item)) || [];
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
