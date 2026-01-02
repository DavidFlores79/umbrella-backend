// ABOUTME: Unit tests for VendorService following project patterns.
// ABOUTME: Tests cover CRUD operations with multi-tenant isolation, validation, and error handling.

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { VendorService } from './VendorService';
import { Vendor } from '../entity/Vendor';
import { CreateVendorPayloadDto } from '../dto/CreateVendorPayloadDto';
import { UpdateVendorPayloadDto } from '../dto/UpdateVendorPayloadDto';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';

interface MockQueryBuilder {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  returning: jest.Mock;
  execute: jest.Mock;
  getOne: jest.Mock;
}

interface MockEntityManager {
  createQueryBuilder: jest.Mock;
}

const mockQueryBuilder: MockQueryBuilder = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  getOne: jest.fn(),
};

const createMockRepository = () => ({
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  existsBy: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
});

describe('VendorService', () => {
  let service: VendorService;
  let vendorRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };
  let mockEntityManager: MockEntityManager;

  const companyId = randomUUID();

  const fakeVendor: Partial<Vendor> = {
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
  };

  beforeAll(async () => {
    vendorRepo = createMockRepository();

    mockEntityManager = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          (cb: (manager: typeof mockEntityManager) => Promise<unknown>) => {
            return cb(mockEntityManager);
          },
        ),
    };

    vendorRepo.createQueryBuilder = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorService,
        {
          provide: getRepositoryToken(Vendor),
          useValue: vendorRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<VendorService>(VendorService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a vendor with companyId', async () => {
      const payload: CreateVendorPayloadDto = {
        name: 'New Supplier',
        email: 'new@supplier.com',
        phone: '+1-555-111-2222',
        contactName: 'Contact Person',
      };

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      vendorRepo.createQueryBuilder.mockReturnValue(qbMock);

      const savedVendor = { ...payload, id: randomUUID(), companyId };
      vendorRepo.create.mockReturnValue(savedVendor);
      vendorRepo.save.mockResolvedValue(savedVendor);

      const result = await service.create(companyId, payload);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.companyId).toBe(companyId);
      expect(vendorRepo.create).toHaveBeenCalledWith({
        ...payload,
        companyId,
      });
      expect(vendorRepo.save).toHaveBeenCalled();
    });

    it('creates a vendor without email (no validation)', async () => {
      const payload: CreateVendorPayloadDto = {
        name: 'Anonymous Supplier',
      };

      const savedVendor = { ...payload, id: randomUUID(), companyId, email: null };
      vendorRepo.create.mockReturnValue(savedVendor);
      vendorRepo.save.mockResolvedValue(savedVendor);

      const result = await service.create(companyId, payload);

      expect(result).toBeDefined();
      expect(vendorRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('throws ConflictException if email already exists for company', async () => {
      const payload: CreateVendorPayloadDto = {
        name: 'Duplicate Vendor',
        email: 'existing@supplier.com',
      };

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'existing-id', email: 'existing@supplier.com' }),
      };
      vendorRepo.createQueryBuilder.mockReturnValue(qbMock);

      await expect(service.create(companyId, payload)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated vendors for company', async () => {
      vendorRepo.findAndCount.mockResolvedValue([[fakeVendor], 1]);

      const result = await service.findAll(companyId, { page: 1, limit: 10 });

      expect(result.docs).toEqual([fakeVendor]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.pages).toBe(1);
      expect(vendorRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId }),
        }),
      );
    });

    it('applies filters correctly', async () => {
      vendorRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(companyId, {
        page: 1,
        limit: 10,
        name: 'Acme',
        isActive: true,
      });

      expect(vendorRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId,
            isActive: true,
          }),
        }),
      );
    });

    it('calculates pagination correctly for multiple pages', async () => {
      vendorRepo.findAndCount.mockResolvedValue([[fakeVendor], 25]);

      const result = await service.findAll(companyId, { page: 2, limit: 10 });

      expect(result.pages).toBe(3);
      expect(result.page).toBe(2);
    });
  });

  describe('findById', () => {
    it('returns vendor if exists for company', async () => {
      vendorRepo.findOneBy.mockResolvedValue(fakeVendor);

      const result = await service.findById(companyId, fakeVendor.id as string);

      expect(result).toBeDefined();
      expect(result.id).toEqual(fakeVendor.id);
      expect(vendorRepo.findOneBy).toHaveBeenCalledWith({
        id: fakeVendor.id,
        companyId,
      });
    });

    it('throws NotFoundException if vendor does not exist', async () => {
      vendorRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findById(companyId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateById', () => {
    it('updates vendor successfully', async () => {
      const id = randomUUID();
      vendorRepo.existsBy.mockResolvedValue(true);

      const returnedRow = {
        id,
        company_id: companyId,
        name: 'Updated Vendor',
        email: 'updated@supplier.com',
        phone: '+1-555-999-8888',
        address: '789 New Street',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        postal_code: '90001',
        tax_id: '98-7654321',
        contact_name: 'New Contact',
        notes: 'Updated notes',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 1,
        raw: [returnedRow],
      });

      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const payload: UpdateVendorPayloadDto = {
        name: 'Updated Vendor',
        updatedAt: new Date().toISOString(),
      };

      const result = await service.updateById(companyId, id, payload);

      expect(vendorRepo.existsBy).toHaveBeenCalledWith({ id, companyId });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toEqual(id);
      expect(result.name).toEqual('Updated Vendor');
    });

    it('throws NotFoundException if vendor does not exist', async () => {
      const id = randomUUID();
      vendorRepo.existsBy.mockResolvedValue(false);

      const payload: UpdateVendorPayloadDto = {
        name: 'Updated Vendor',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws OutdatedEntityVersionError when affected === 0', async () => {
      const id = randomUUID();
      vendorRepo.existsBy.mockResolvedValue(true);

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 0,
        raw: [],
      });

      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const payload: UpdateVendorPayloadDto = {
        name: 'Updated Vendor',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        OutdatedEntityVersionError,
      );
    });

    it('validates unique email when updating', async () => {
      const id = randomUUID();
      vendorRepo.existsBy.mockResolvedValue(true);

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'other-id', email: 'taken@supplier.com' }),
      };
      vendorRepo.createQueryBuilder.mockReturnValue(qbMock);

      const payload: UpdateVendorPayloadDto = {
        email: 'taken@supplier.com',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deletes vendor successfully', async () => {
      vendorRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(companyId, 'some-id');

      expect(vendorRepo.delete).toHaveBeenCalledWith({ id: 'some-id', companyId });
    });

    it('throws NotFoundException if vendor does not exist', async () => {
      vendorRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(companyId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
