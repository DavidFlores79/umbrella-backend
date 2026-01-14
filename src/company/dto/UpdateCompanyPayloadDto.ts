// ABOUTME: DTO for updating an existing company with validation rules.
// ABOUTME: All fields are optional, includes updatedAt for optimistic locking.

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
  IsUrl,
  IsIn,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompanySettingsDto } from './CompanySettingsDto';
import { CompanyStatus } from '../entity/Company';

export class UpdateCompanyPayloadDto {
  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Acme Corporation',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Company email',
    example: 'contact@acme.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Company phone number',
    example: '+1-555-123-4567',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Company address',
    example: '123 Main Street',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'New York',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State/Province',
    example: 'NY',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'USA',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Postal/ZIP code',
    example: '10001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Tax ID / EIN / RFC',
    example: '12-3456789',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://www.acme.com',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({
    description: 'Company logo URL',
    example: 'https://www.acme.com/logo.png',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logo?: string;

  @ApiPropertyOptional({
    description: 'Company settings',
    type: CompanySettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanySettingsDto)
  settings?: CompanySettingsDto;

  @ApiPropertyOptional({
    description: 'Company status',
    enum: ['active', 'inactive', 'suspended'],
    example: 'active',
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: CompanyStatus;

  @ApiPropertyOptional({
    description: 'Last updated timestamp for optimistic locking',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}
