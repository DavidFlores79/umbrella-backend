// ABOUTME: Response DTO for client data with Swagger documentation.
// ABOUTME: Used to serialize client entities for API responses.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Client } from '../entity/Client';

export class ClientDto {
  @ApiProperty({
    description: 'Client unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID that owns this client',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  companyId: string;

  @ApiProperty({
    description: 'Client name',
    example: 'John Doe',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Client email',
    example: 'john.doe@example.com',
  })
  email: string | null;

  @ApiPropertyOptional({
    description: 'Client phone number',
    example: '+1-555-123-4567',
  })
  phone: string | null;

  @ApiPropertyOptional({
    description: 'Client address',
    example: '123 Main Street',
  })
  address: string | null;

  @ApiPropertyOptional({
    description: 'City',
    example: 'New York',
  })
  city: string | null;

  @ApiPropertyOptional({
    description: 'State/Province',
    example: 'NY',
  })
  state: string | null;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'USA',
  })
  country: string | null;

  @ApiPropertyOptional({
    description: 'Postal/ZIP code',
    example: '10001',
  })
  postalCode: string | null;

  @ApiPropertyOptional({
    description: 'Tax ID / RFC',
    example: 'XAXX010101000',
  })
  taxId: string | null;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'VIP customer',
  })
  notes: string | null;

  @ApiProperty({
    description: 'Whether the client is active',
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

  static buildDto(entity: Client): ClientDto {
    const dto = new ClientDto();
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
    dto.notes = entity.notes;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
