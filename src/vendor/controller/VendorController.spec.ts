// ABOUTME: Unit tests for VendorController following project patterns.
// ABOUTME: Tests cover all CRUD endpoints with company context and DTO transformation.

import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';

import { VendorController } from './VendorController';
import { VendorService } from '../service/VendorService';
import { Vendor } from '../entity/Vendor';
import { VendorDto } from '../dto/VendorDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { CreateVendorPayloadDto } from '../dto/CreateVendorPayloadDto';
import { UpdateVendorPayloadDto } from '../dto/UpdateVendorPayloadDto';

describe('VendorController', () => {
  let controller: VendorController;

  const mockVendorService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    remove: jest.fn(),
  };

  const companyId = randomUUID();

  const fakeVendor: Vendor = {
    id: randomUUID(),
    companyId,
    name: 'Acme Supplies Inc.',
    email: 'orders@acmesupplies.com',
    phone: '+1-555-987-6543',
    address: '456 Industrial Blvd',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    postalCode: '60601',
    taxId: 'XAXX010101000',
    contactName: 'Jane Smith',
    notes: 'Preferred supplier',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Vendor;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        {
          provide: VendorService,
          useValue: mockVendorService,
        },
      ],
    }).compile();

    controller = module.get<VendorController>(VendorController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns paginated vendors as DTOs', async () => {
      mockVendorService.findAll.mockResolvedValue({
        docs: [fakeVendor],
        total: 1,
        page: 1,
        pages: 1,
        limit: 10,
      });

      const result: PaginationResultDto<VendorDto> = await controller.findAll(
        companyId,
        { page: 1, limit: 10 },
      );

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]).toBeInstanceOf(VendorDto);
      expect(result.docs[0].id).toBe(fakeVendor.id);
      expect(result.docs[0].name).toBe(fakeVendor.name);
      expect(result.docs[0].companyId).toBe(companyId);
      expect(result.total).toBe(1);
      expect(mockVendorService.findAll).toHaveBeenCalledWith(companyId, {
        page: 1,
        limit: 10,
      });
    });

    it('passes filters to service', async () => {
      mockVendorService.findAll.mockResolvedValue({
        docs: [],
        total: 0,
        page: 1,
        pages: 0,
        limit: 10,
      });

      await controller.findAll(companyId, {
        page: 1,
        limit: 10,
        name: 'Acme',
        isActive: true,
      });

      expect(mockVendorService.findAll).toHaveBeenCalledWith(companyId, {
        page: 1,
        limit: 10,
        name: 'Acme',
        isActive: true,
      });
    });
  });

  describe('getById', () => {
    it('returns a VendorDto if found', async () => {
      mockVendorService.findById.mockResolvedValue(fakeVendor);

      const result = await controller.getById(companyId, fakeVendor.id);

      expect(result).toBeInstanceOf(VendorDto);
      expect(result.id).toEqual(fakeVendor.id);
      expect(result.name).toEqual(fakeVendor.name);
      expect(result.email).toEqual(fakeVendor.email);
      expect(result.contactName).toEqual(fakeVendor.contactName);
      expect(mockVendorService.findById).toHaveBeenCalledWith(companyId, fakeVendor.id);
    });
  });

  describe('create', () => {
    it('returns a VendorDto after creation', async () => {
      mockVendorService.create.mockResolvedValue(fakeVendor);

      const payload: CreateVendorPayloadDto = {
        name: 'Acme Supplies Inc.',
        email: 'orders@acmesupplies.com',
        phone: '+1-555-987-6543',
        contactName: 'Jane Smith',
      };

      const result = await controller.create(companyId, payload);

      expect(result).toBeInstanceOf(VendorDto);
      expect(result.name).toBe(fakeVendor.name);
      expect(result.email).toBe(fakeVendor.email);
      expect(mockVendorService.create).toHaveBeenCalledWith(companyId, payload);
    });
  });

  describe('updateById', () => {
    it('returns updated VendorDto', async () => {
      const updatedVendor = { ...fakeVendor, name: 'Updated Supplier' };
      mockVendorService.updateById.mockResolvedValue(updatedVendor);

      const payload: UpdateVendorPayloadDto = {
        name: 'Updated Supplier',
        updatedAt: new Date().toISOString(),
      };

      const result = await controller.updateById(companyId, fakeVendor.id, payload);

      expect(result).toBeInstanceOf(VendorDto);
      expect(result.name).toBe('Updated Supplier');
      expect(mockVendorService.updateById).toHaveBeenCalledWith(
        companyId,
        fakeVendor.id,
        payload,
      );
    });
  });

  describe('deleteById', () => {
    it('calls remove service method', async () => {
      mockVendorService.remove.mockResolvedValue(undefined);

      await controller.deleteById(companyId, fakeVendor.id);

      expect(mockVendorService.remove).toHaveBeenCalledWith(companyId, fakeVendor.id);
    });
  });
});
