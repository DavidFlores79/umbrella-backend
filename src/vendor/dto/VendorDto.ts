// ABOUTME: Response DTO for vendor data with Swagger documentation.
// ABOUTME: Used to serialize vendor entities for API responses.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Vendor } from '../entity/Vendor';

export class VendorDto {
  @ApiProperty({
    description: 'Vendor unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID that owns this vendor',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  companyId: string;

  @ApiProperty({
    description: 'Vendor name',
    example: 'Acme Supplies Inc.',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Vendor email',
    example: 'orders@acmesupplies.com',
  })
  email: string | null;

  @ApiPropertyOptional({
    description: 'Vendor phone number',
    example: '+1-555-987-6543',
  })
  phone: string | null;

  @ApiPropertyOptional({
    description: 'Vendor address',
    example: '456 Industrial Blvd',
  })
  address: string | null;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Chicago',
  })
  city: string | null;

  @ApiPropertyOptional({
    description: 'State/Province',
    example: 'IL',
  })
  state: string | null;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'USA',
  })
  country: string | null;

  @ApiPropertyOptional({
    description: 'Postal/ZIP code',
    example: '60601',
  })
  postalCode: string | null;

  @ApiPropertyOptional({
    description: 'Tax ID / RFC',
    example: 'XAXX010101000',
  })
  taxId: string | null;

  @ApiPropertyOptional({
    description: 'Primary contact name',
    example: 'Jane Smith',
  })
  contactName: string | null;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Preferred supplier',
  })
  notes: string | null;

  @ApiProperty({
    description: 'Whether the vendor is active',
    example: true,
  })
  isActive: boolean;

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

  static buildDto(entity: Vendor): VendorDto {
    const dto = new VendorDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.name = entity.name;
    dto.email = entity.email;
    dto.phone = entity.phone;
    dto.address = entity.address;
    dto.city = entity.city;
    dto.state = entity.state;
    dto.country = entity.country;
    dto.postalCode = entity.postalCode;
    dto.taxId = entity.taxId;
    dto.contactName = entity.contactName;
    dto.notes = entity.notes;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
