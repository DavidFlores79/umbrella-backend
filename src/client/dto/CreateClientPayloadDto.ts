// ABOUTME: DTO for creating a new client with validation rules.
// ABOUTME: Contains required and optional fields for client creation.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class CreateClientPayloadDto {
  @ApiProperty({
    description: 'Client name',
    example: 'John Doe',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Client email',
    example: 'john.doe@example.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Client phone number',
    example: '+1-555-123-4567',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Client address',
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
    description: 'Tax ID / RFC',
    example: 'XAXX010101000',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'VIP customer, preferred contact by email',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether the client is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
