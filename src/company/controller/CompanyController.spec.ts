// ABOUTME: Unit tests for CompanyController following project patterns.
// ABOUTME: Tests cover all CRUD endpoints and proper DTO transformation.

import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';

import { CompanyController } from './CompanyController';
import { CompanyService } from '../service/CompanyService';
import { Company } from '../entity/Company';
import { CompanyDto } from '../dto/CompanyDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { CreateCompanyPayloadDto } from '../dto/CreateCompanyPayloadDto';
import { UpdateCompanyPayloadDto } from '../dto/UpdateCompanyPayloadDto';
import { DEFAULT_COMPANY_SETTINGS } from '../interface/CompanySettings';
import { JwtAuthGuard } from '../../shared/guard/JwtAuthGuard';
import { RolesGuard } from '../../shared/guard/RolesGuard';
import { PermissionsGuard } from '../../shared/guard/PermissionsGuard';

describe('CompanyController', () => {
  let controller: CompanyController;

  const mockCompanyService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    remove: jest.fn(),
  };

  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  const fakeCompany: Company = {
    id: randomUUID(),
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-123-4567',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10001',
    taxId: '12-3456789',
    website: 'https://www.acme.com',
    logo: null,
    settings: DEFAULT_COMPANY_SETTINGS,
    status: 'active',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Company;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<CompanyController>(CompanyController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns paginated companies as DTOs', async () => {
      mockCompanyService.findAll.mockResolvedValue({
        docs: [fakeCompany],
        total: 1,
        page: 1,
        pages: 1,
        limit: 10,
      });

      const result: PaginationResultDto<CompanyDto> = await controller.findAll({
        page: 1,
        limit: 10,
      });

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]).toBeInstanceOf(CompanyDto);
      expect(result.docs[0].id).toBe(fakeCompany.id);
      expect(result.docs[0].name).toBe(fakeCompany.name);
      expect(result.total).toBe(1);
      expect(mockCompanyService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it('passes filters to service', async () => {
      mockCompanyService.findAll.mockResolvedValue({
        docs: [],
        total: 0,
        page: 1,
        pages: 0,
        limit: 10,
      });

      await controller.findAll({
        page: 1,
        limit: 10,
        name: 'Acme',
        status: 'active',
      });

      expect(mockCompanyService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        name: 'Acme',
        status: 'active',
      });
    });
  });

  describe('getById', () => {
    it('returns a CompanyDto if found', async () => {
      mockCompanyService.findById.mockResolvedValue(fakeCompany);

      const result = await controller.getById(fakeCompany.id);

      expect(result).toBeInstanceOf(CompanyDto);
      expect(result.id).toEqual(fakeCompany.id);
      expect(result.name).toEqual(fakeCompany.name);
      expect(result.email).toEqual(fakeCompany.email);
      expect(result.settings).toEqual(fakeCompany.settings);
      expect(mockCompanyService.findById).toHaveBeenCalledWith(fakeCompany.id);
    });
  });

  describe('create', () => {
    it('returns a CompanyDto after creation', async () => {
      mockCompanyService.create.mockResolvedValue(fakeCompany);

      const payload: CreateCompanyPayloadDto = {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-123-4567',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
      };

      const result = await controller.create(payload);

      expect(result).toBeInstanceOf(CompanyDto);
      expect(result.name).toBe(fakeCompany.name);
      expect(result.email).toBe(fakeCompany.email);
      expect(mockCompanyService.create).toHaveBeenCalledWith(payload);
    });

    it('passes settings to service when provided', async () => {
      mockCompanyService.create.mockResolvedValue({
        ...fakeCompany,
        settings: { ...DEFAULT_COMPANY_SETTINGS, currency: 'EUR' },
      });

      const payload: CreateCompanyPayloadDto = {
        name: 'European Company',
        email: 'eu@company.com',
        settings: { currency: 'EUR' } as any,
      };

      const result = await controller.create(payload);

      expect(result.settings.currency).toBe('EUR');
      expect(mockCompanyService.create).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateById', () => {
    it('returns updated CompanyDto', async () => {
      const updatedCompany = { ...fakeCompany, name: 'Updated Name' };
      mockCompanyService.updateById.mockResolvedValue(updatedCompany);

      const payload: UpdateCompanyPayloadDto = {
        name: 'Updated Name',
        updatedAt: new Date().toISOString(),
      };

      const result = await controller.updateById(fakeCompany.id, payload);

      expect(result).toBeInstanceOf(CompanyDto);
      expect(result.name).toBe('Updated Name');
      expect(mockCompanyService.updateById).toHaveBeenCalledWith(
        fakeCompany.id,
        payload,
      );
    });
  });

  describe('deleteById', () => {
    it('calls remove service method', async () => {
      mockCompanyService.remove.mockResolvedValue(undefined);

      await controller.deleteById(fakeCompany.id);

      expect(mockCompanyService.remove).toHaveBeenCalledWith(fakeCompany.id);
    });
  });
});
