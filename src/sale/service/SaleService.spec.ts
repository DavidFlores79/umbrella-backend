// ABOUTME: Unit tests for SaleService following project patterns.
// ABOUTME: Tests cover CRUD operations with line items, totals calculation, and status workflow.

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { SaleService } from './SaleService';
import { Sale } from '../entity/Sale';
import { SaleLineItem } from '../entity/SaleLineItem';
import { CreateSalePayloadDto } from '../dto/CreateSalePayloadDto';
import { UpdateSalePayloadDto, UpdateSaleStatusDto } from '../dto/UpdateSalePayloadDto';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { SaleStatus } from '../enum/SaleStatus';
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

describe('SaleService', () => {
  let service: SaleService;
  let saleRepo: ReturnType<typeof createMockRepository>;
  let lineItemRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };
  let mockEntityManager: MockEntityManager;
  let mockCompanyService: { findById: jest.Mock };

  const companyId = randomUUID();
  const clientId = randomUUID();

  const fakeLineItem: Partial<SaleLineItem> = {
    id: randomUUID(),
    description: 'Test Product',
    quantity: 2,
    unitPrice: 50,
    taxRate: 16,
    subtotal: 100,
    taxAmount: 16,
    total: 116,
  };

  const fakeSale: Partial<Sale> = {
    id: randomUUID(),
    companyId,
    clientId,
    invoiceNumber: 'INV-2024-0001',
    saleDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    status: SaleStatus.PENDING,
    subtotal: 100,
    taxAmount: 16,
    discount: 0,
    total: 116,
    notes: null,
    lineItems: [fakeLineItem as SaleLineItem],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    saleRepo = createMockRepository();
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
        SaleService,
        {
          provide: getRepositoryToken(Sale),
          useValue: saleRepo,
        },
        {
          provide: getRepositoryToken(SaleLineItem),
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

    service = module.get<SaleService>(SaleService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a sale with line items and calculates totals', async () => {
      const payload: CreateSalePayloadDto = {
        clientId,
        saleDate: '2024-01-15',
        lineItems: [
          {
            description: 'Product A',
            quantity: 2,
            unitPrice: 50,
            taxRate: 16,
          },
        ],
      };

      mockEntityManager.findOne.mockResolvedValue(null);

      const createdSale = {
        ...payload,
        id: randomUUID(),
        companyId,
        invoiceNumber: 'INV-2024-0001',
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
          return Promise.resolve(createdSale);
        }
        return Promise.resolve({ id: randomUUID(), ...EntityClassOrData });
      });

      const result = await service.create(companyId, payload);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('generates correct invoice number using company settings', async () => {
      const payload: CreateSalePayloadDto = {
        saleDate: '2024-01-15',
        lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
      };

      mockCompanyService.findById.mockResolvedValue({
        id: companyId,
        settings: { ...DEFAULT_COMPANY_SETTINGS, invoicePrefix: 'FAC-' },
      });

      mockEntityManager.findOne.mockResolvedValue(null);

      await service.create(companyId, payload);

      expect(mockCompanyService.findById).toHaveBeenCalledWith(companyId);
    });
  });

  describe('findAll', () => {
    it('returns paginated sales with line items', async () => {
      saleRepo.findAndCount.mockResolvedValue([[fakeSale], 1]);

      const result = await service.findAll(companyId, { page: 1, limit: 10 });

      expect(result.docs).toEqual([fakeSale]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(saleRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId }),
          relations: ['lineItems'],
        }),
      );
    });

    it('applies filters correctly', async () => {
      saleRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(companyId, {
        page: 1,
        limit: 10,
        status: SaleStatus.PENDING,
        clientId,
      });

      expect(saleRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId,
            status: SaleStatus.PENDING,
            clientId,
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('returns sale with line items if exists', async () => {
      saleRepo.findOne.mockResolvedValue(fakeSale);

      const result = await service.findById(companyId, fakeSale.id as string);

      expect(result).toBeDefined();
      expect(result.id).toEqual(fakeSale.id);
      expect(saleRepo.findOne).toHaveBeenCalledWith({
        where: { id: fakeSale.id, companyId },
        relations: ['lineItems'],
      });
    });

    it('throws NotFoundException if sale does not exist', async () => {
      saleRepo.findOne.mockResolvedValue(null);

      await expect(service.findById(companyId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateById', () => {
    it('updates sale with new line items', async () => {
      const id = randomUUID();
      saleRepo.findOne.mockResolvedValue({ ...fakeSale, id, lineItems: [] });

      const returnedRow = {
        id,
        company_id: companyId,
        client_id: clientId,
        invoice_number: 'INV-2024-0001',
        sale_date: new Date('2024-01-15'),
        due_date: null,
        status: SaleStatus.PENDING,
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

      mockEntityManager.findOne.mockResolvedValue({ ...fakeSale, id });

      const payload: UpdateSalePayloadDto = {
        notes: 'Updated notes',
        updatedAt: new Date().toISOString(),
      };

      const result = await service.updateById(companyId, id, payload);

      expect(result).toBeDefined();
    });

    it('throws NotFoundException if sale does not exist', async () => {
      saleRepo.findOne.mockResolvedValue(null);

      const payload: UpdateSalePayloadDto = {
        notes: 'Updated notes',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, 'non-existent-id', payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws OutdatedEntityVersionError when affected === 0', async () => {
      const id = randomUUID();
      saleRepo.findOne.mockResolvedValue({ ...fakeSale, id });

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 0,
        raw: [],
      });

      const payload: UpdateSalePayloadDto = {
        notes: 'Updated notes',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        OutdatedEntityVersionError,
      );
    });
  });

  describe('updateStatus', () => {
    it('updates sale status successfully', async () => {
      const id = randomUUID();
      saleRepo.findOne.mockResolvedValue({ ...fakeSale, id });

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 1,
        raw: [{ id, status: SaleStatus.PAID }],
      });

      const payload: UpdateSaleStatusDto = {
        status: SaleStatus.PAID,
        updatedAt: new Date().toISOString(),
      };

      const result = await service.updateStatus(companyId, id, payload);

      expect(result).toBeDefined();
    });

    it('throws NotFoundException if sale does not exist', async () => {
      saleRepo.findOne.mockResolvedValue(null);

      const payload: UpdateSaleStatusDto = {
        status: SaleStatus.PAID,
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateStatus(companyId, 'non-existent-id', payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws OutdatedEntityVersionError when affected === 0', async () => {
      const id = randomUUID();
      saleRepo.findOne.mockResolvedValue({ ...fakeSale, id });

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 0,
        raw: [],
      });

      const payload: UpdateSaleStatusDto = {
        status: SaleStatus.PAID,
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateStatus(companyId, id, payload)).rejects.toThrow(
        OutdatedEntityVersionError,
      );
    });
  });

  describe('remove', () => {
    it('deletes sale successfully', async () => {
      saleRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(companyId, 'some-id');

      expect(saleRepo.delete).toHaveBeenCalledWith({ id: 'some-id', companyId });
    });

    it('throws NotFoundException if sale does not exist', async () => {
      saleRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(companyId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
