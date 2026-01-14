// ABOUTME: Response DTO for company data with Swagger documentation.
// ABOUTME: Used to serialize company entities for API responses.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Company, CompanyStatus } from '../entity/Company';
import { CompanySettings } from '../interface/CompanySettings';

export class CompanyDto {
  @ApiProperty({
    description: 'Company unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Acme Corporation',
  })
  name: string;

  @ApiProperty({
    description: 'Company email',
    example: 'contact@acme.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Company phone number',
    example: '+1-555-123-4567',
  })
  phone: string | null;

  @ApiPropertyOptional({
    description: 'Company address',
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
    description: 'Tax ID / EIN / RFC',
    example: '12-3456789',
  })
  taxId: string | null;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://www.acme.com',
  })
  website: string | null;

  @ApiPropertyOptional({
    description: 'Company logo URL',
    example: 'https://www.acme.com/logo.png',
  })
  logo: string | null;

  @ApiProperty({
    description: 'Company settings',
  })
  settings: CompanySettings;

  @ApiProperty({
    description: 'Company status',
    enum: ['active', 'inactive', 'suspended'],
    example: 'active',
  })
  status: CompanyStatus;

  @ApiProperty({
    description: 'Whether the company is active',
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

  static buildDto(entity: Company): CompanyDto {
    const dto = new CompanyDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.email = entity.email;
    dto.phone = entity.phone;
    dto.address = entity.address;
    dto.city = entity.city;
    dto.state = entity.state;
    dto.country = entity.country;
    dto.postalCode = entity.postalCode;
    dto.taxId = entity.taxId;
    dto.website = entity.website;
    dto.logo = entity.logo;
    dto.settings = entity.settings;
    dto.status = entity.status;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
