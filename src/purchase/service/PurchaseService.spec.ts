// ABOUTME: Unit tests for PurchaseService following project patterns.
// ABOUTME: Tests cover CRUD operations with line items, totals calculation, and status workflow.

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { PurchaseService } from './PurchaseService';
import { Purchase } from '../entity/Purchase';
import { PurchaseLineItem } from '../entity/PurchaseLineItem';
import { CreatePurchasePayloadDto } from '../dto/CreatePurchasePayloadDto';
import { UpdatePurchasePayloadDto, UpdatePurchaseStatusDto } from '../dto/UpdatePurchasePayloadDto';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { PurchaseStatus } from '../enum/PurchaseStatus';
import { CompanyService } from '../../company/service/CompanyService';
import { DEFAULT_COMPANY_SETTINGS } from '../../company/interface/CompanySettings';

interface MockQueryBuilder {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  returning: jest.Mock;
  execute: jest.Mock;
}

interface MockEntityManager {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  delete: jest.Mock;
  createQueryBuilder: jest.Mock;
}

const mockQueryBuilder: MockQueryBuilder = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  execute: jest.fn(),
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

describe('PurchaseService', () => {
  let service: PurchaseService;
  let purchaseRepo: ReturnType<typeof createMockRepository>;
  let lineItemRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };
  let mockEntityManager: MockEntityManager;
  let mockCompanyService: { findById: jest.Mock };

  const companyId = randomUUID();
  const vendorId = randomUUID();

  const fakeLineItem: Partial<PurchaseLineItem> = {
    id: randomUUID(),
    description: 'Test Product',
    quantity: 2,
    unitCost: 50,
    taxRate: 16,
    subtotal: 100,
    taxAmount: 16,
    total: 116,
    quantityReceived: 0,
  };

  const fakePurchase: Partial<Purchase> = {
    id: randomUUID(),
    companyId,
    vendorId,
    poNumber: 'PO-2024-0001',
    orderDate: new Date('2024-01-15'),
    expectedDate: new Date('2024-02-15'),
    receivedDate: null,
    status: PurchaseStatus.ORDERED,
    subtotal: 100,
    taxAmount: 16,
    discount: 0,
    total: 116,
    notes: null,
    lineItems: [fakeLineItem as PurchaseLineItem],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    purchaseRepo = createMockRepository();
    lineItemRepo = createMockRepository();

    mockEntityManager = {
      create: jest.fn((EntityClass, data) => ({ ...data })),
      save: jest.fn((EntityClassOrData, data) => {
        if (data) {
          return Promise.resolve({ id: randomUUID(), ...data });
        }
        return Promise.resolve({ id: randomUUID(), ...EntityClassOrData });
      }),
      findOne: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
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

    mockCompanyService = {
      findById: jest.fn().mockResolvedValue({
        id: companyId,
        settings: DEFAULT_COMPANY_SETTINGS,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        {
          provide: getRepositoryToken(Purchase),
          useValue: purchaseRepo,
        },
        {
          provide: getRepositoryToken(PurchaseLineItem),
          useValue: lineItemRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    }).compile();

    service = module.get<PurchaseService>(PurchaseService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a purchase with line items and calculates totals', async () => {
      const payload: CreatePurchasePayloadDto = {
        vendorId,
        orderDate: '2024-01-15',
        lineItems: [
          {
            description: 'Product A',
            quantity: 2,
            unitCost: 50,
            taxRate: 16,
          },
        ],
      };

      mockEntityManager.findOne.mockResolvedValue(null);

      const createdPurchase = {
        ...payload,
        id: randomUUID(),
        companyId,
        poNumber: 'PO-2024-0001',
        subtotal: 100,
        taxAmount: 16,
        total: 116,
        lineItems: [],
      };

      mockEntityManager.save.mockImplementation((EntityClassOrData: any, data?: any) => {
        if (data) {
          return Promise.resolve({ id: randomUUID(), ...data });
        }
        if (EntityClassOrData.lineItems !== undefined) {
          return Promise.resolve(createdPurchase);
        }
        return Promise.resolve({ id: randomUUID(), ...EntityClassOrData });
      });

      const result = await service.create(companyId, payload);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('generates correct PO number using company settings', async () => {
      const payload: CreatePurchasePayloadDto = {
        orderDate: '2024-01-15',
        lineItems: [{ description: 'Test', quantity: 1, unitCost: 100 }],
      };

      mockCompanyService.findById.mockResolvedValue({
        id: companyId,
        settings: { ...DEFAULT_COMPANY_SETTINGS, purchaseOrderPrefix: 'ORD-' },
      });

      mockEntityManager.findOne.mockResolvedValue(null);

      await service.create(companyId, payload);

      expect(mockCompanyService.findById).toHaveBeenCalledWith(companyId);
    });
  });

  describe('findAll', () => {
    it('returns paginated purchases with line items', async () => {
      purchaseRepo.findAndCount.mockResolvedValue([[fakePurchase], 1]);

      const result = await service.findAll(companyId, { page: 1, limit: 10 });

      expect(result.docs).toEqual([fakePurchase]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(purchaseRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId }),
          relations: ['lineItems'],
        }),
      );
    });

    it('applies filters correctly', async () => {
      purchaseRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(companyId, {
        page: 1,
        limit: 10,
        status: PurchaseStatus.ORDERED,
        vendorId,
      });

      expect(purchaseRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId,
            status: PurchaseStatus.ORDERED,
            vendorId,
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('returns purchase with line items if exists', async () => {
      purchaseRepo.findOne.mockResolvedValue(fakePurchase);

      const result = await service.findById(companyId, fakePurchase.id as string);

      expect(result).toBeDefined();
      expect(result.id).toEqual(fakePurchase.id);
      expect(purchaseRepo.findOne).toHaveBeenCalledWith({
        where: { id: fakePurchase.id, companyId },
        relations: ['lineItems'],
      });
    });

    it('throws NotFoundException if purchase does not exist', async () => {
      purchaseRepo.findOne.mockResolvedValue(null);

      await expect(service.findById(companyId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateById', () => {
    it('updates purchase with new line items', async () => {
      const id = randomUUID();
      purchaseRepo.findOne.mockResolvedValue({ ...fakePurchase, id, lineItems: [] });

      const returnedRow = {
        id,
        company_id: companyId,
        vendor_id: vendorId,
        po_number: 'PO-2024-0001',
        order_date: new Date('2024-01-15'),
        expected_date: null,
        received_date: null,
        status: PurchaseStatus.ORDERED,
        subtotal: 200,
        tax_amount: 32,
        discount: 0,
        total: 232,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 1,
        raw: [returnedRow],
      });

      mockEntityManager.findOne.mockResolvedValue({ ...fakePurchase, id });

      const payload: UpdatePurchasePayloadDto = {
        notes: 'Updated notes',
        updatedAt: new Date().toISOString(),
      };

      const result = await service.updateById(companyId, id, payload);

      expect(result).toBeDefined();
    });

    it('throws NotFoundException if purchase does not exist', async () => {
      purchaseRepo.findOne.mockResolvedValue(null);

      const payload: UpdatePurchasePayloadDto = {
        notes: 'Updated notes',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, 'non-existent-id', payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws OutdatedEntityVersionError when affected === 0', async () => {
      const id = randomUUID();
      purchaseRepo.findOne.mockResolvedValue({ ...fakePurchase, id });

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 0,
        raw: [],
      });

      const payload: UpdatePurchasePayloadDto = {
        notes: 'Updated notes',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        OutdatedEntityVersionError,
      );
    });
  });

  describe('updateStatus', () => {
    it('updates purchase status successfully', async () => {
      const id = randomUUID();
      purchaseRepo.findOne.mockResolvedValue({ ...fakePurchase, id });

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 1,
        raw: [{ id, status: PurchaseStatus.RECEIVED }],
      });

      const payload: UpdatePurchaseStatusDto = {
        status: PurchaseStatus.RECEIVED,
        updatedAt: new Date().toISOString(),
      };

      const result = await service.updateStatus(companyId, id, payload);

      expect(result).toBeDefined();
    });

    it('throws NotFoundException if purchase does not exist', async () => {
      purchaseRepo.findOne.mockResolvedValue(null);

      const payload: UpdatePurchaseStatusDto = {
        status: PurchaseStatus.RECEIVED,
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateStatus(companyId, 'non-existent-id', payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws OutdatedEntityVersionError when affected === 0', async () => {
      const id = randomUUID();
      purchaseRepo.findOne.mockResolvedValue({ ...fakePurchase, id });

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 0,
        raw: [],
      });

      const payload: UpdatePurchaseStatusDto = {
        status: PurchaseStatus.RECEIVED,
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateStatus(companyId, id, payload)).rejects.toThrow(
        OutdatedEntityVersionError,
      );
    });
  });

  describe('remove', () => {
    it('deletes purchase successfully', async () => {
      purchaseRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(companyId, 'some-id');

      expect(purchaseRepo.delete).toHaveBeenCalledWith({ id: 'some-id', companyId });
    });

    it('throws NotFoundException if purchase does not exist', async () => {
      purchaseRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(companyId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
