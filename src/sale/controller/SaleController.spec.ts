// ABOUTME: Unit tests for SaleController following project patterns.
// ABOUTME: Tests cover all CRUD endpoints with company context and DTO transformation.

import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';

import { SaleController } from './SaleController';
import { SaleService } from '../service/SaleService';
import { Sale } from '../entity/Sale';
import { SaleLineItem } from '../entity/SaleLineItem';
import { SaleDto } from '../dto/SaleDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { CreateSalePayloadDto } from '../dto/CreateSalePayloadDto';
import { UpdateSalePayloadDto, UpdateSaleStatusDto } from '../dto/UpdateSalePayloadDto';
import { SaleStatus } from '../enum/SaleStatus';

describe('SaleController', () => {
  let controller: SaleController;

  const mockSaleService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };

  const companyId = randomUUID();
  const clientId = randomUUID();

  const fakeLineItem: SaleLineItem = {
    id: randomUUID(),
    saleId: randomUUID(),
    productId: null,
    description: 'Test Product',
    quantity: 2,
    unitPrice: 50,
    taxRate: 16,
    subtotal: 100,
    taxAmount: 16,
    total: 116,
  } as SaleLineItem;

  const fakeSale: Sale = {
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
    lineItems: [fakeLineItem],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Sale;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleController],
      providers: [
        {
          provide: SaleService,
          useValue: mockSaleService,
        },
      ],
    }).compile();

    controller = module.get<SaleController>(SaleController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns paginated sales as DTOs', async () => {
      mockSaleService.findAll.mockResolvedValue({
        docs: [fakeSale],
        total: 1,
        page: 1,
        pages: 1,
        limit: 10,
      });

      const result: PaginationResultDto<SaleDto> = await controller.findAll(
        companyId,
        { page: 1, limit: 10 },
      );

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]).toBeInstanceOf(SaleDto);
      expect(result.docs[0].id).toBe(fakeSale.id);
      expect(result.docs[0].invoiceNumber).toBe(fakeSale.invoiceNumber);
      expect(result.docs[0].lineItems).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockSaleService.findAll).toHaveBeenCalledWith(companyId, {
        page: 1,
        limit: 10,
      });
    });

    it('passes filters to service', async () => {
      mockSaleService.findAll.mockResolvedValue({
        docs: [],
        total: 0,
        page: 1,
        pages: 0,
        limit: 10,
      });

      await controller.findAll(companyId, {
        page: 1,
        limit: 10,
        status: SaleStatus.PENDING,
        clientId,
      });

      expect(mockSaleService.findAll).toHaveBeenCalledWith(companyId, {
        page: 1,
        limit: 10,
        status: SaleStatus.PENDING,
        clientId,
      });
    });
  });

  describe('getById', () => {
    it('returns a SaleDto with line items if found', async () => {
      mockSaleService.findById.mockResolvedValue(fakeSale);

      const result = await controller.getById(companyId, fakeSale.id);

      expect(result).toBeInstanceOf(SaleDto);
      expect(result.id).toEqual(fakeSale.id);
      expect(result.invoiceNumber).toEqual(fakeSale.invoiceNumber);
      expect(result.lineItems).toHaveLength(1);
      expect(mockSaleService.findById).toHaveBeenCalledWith(companyId, fakeSale.id);
    });
  });

  describe('create', () => {
    it('returns a SaleDto after creation', async () => {
      mockSaleService.create.mockResolvedValue(fakeSale);

      const payload: CreateSalePayloadDto = {
        clientId,
        saleDate: '2024-01-15',
        lineItems: [
          {
            description: 'Test Product',
            quantity: 2,
            unitPrice: 50,
            taxRate: 16,
          },
        ],
      };

      const result = await controller.create(companyId, payload);

      expect(result).toBeInstanceOf(SaleDto);
      expect(result.invoiceNumber).toBe(fakeSale.invoiceNumber);
      expect(result.total).toBe(fakeSale.total);
      expect(mockSaleService.create).toHaveBeenCalledWith(companyId, payload);
    });
  });

  describe('updateById', () => {
    it('returns updated SaleDto', async () => {
      const updatedSale = { ...fakeSale, notes: 'Updated notes' };
      mockSaleService.updateById.mockResolvedValue(updatedSale);

      const payload: UpdateSalePayloadDto = {
        notes: 'Updated notes',
        updatedAt: new Date().toISOString(),
      };

      const result = await controller.updateById(companyId, fakeSale.id, payload);

      expect(result).toBeInstanceOf(SaleDto);
      expect(result.notes).toBe('Updated notes');
      expect(mockSaleService.updateById).toHaveBeenCalledWith(
        companyId,
        fakeSale.id,
        payload,
      );
    });
  });

  describe('updateStatus', () => {
    it('returns SaleDto with updated status', async () => {
      const updatedSale = { ...fakeSale, status: SaleStatus.PAID };
      mockSaleService.updateStatus.mockResolvedValue(updatedSale);

      const payload: UpdateSaleStatusDto = {
        status: SaleStatus.PAID,
        updatedAt: new Date().toISOString(),
      };

      const result = await controller.updateStatus(companyId, fakeSale.id, payload);

      expect(result).toBeInstanceOf(SaleDto);
      expect(result.status).toBe(SaleStatus.PAID);
      expect(mockSaleService.updateStatus).toHaveBeenCalledWith(
        companyId,
        fakeSale.id,
        payload,
      );
    });
  });

  describe('deleteById', () => {
    it('calls remove service method', async () => {
      mockSaleService.remove.mockResolvedValue(undefined);

      await controller.deleteById(companyId, fakeSale.id);

      expect(mockSaleService.remove).toHaveBeenCalledWith(companyId, fakeSale.id);
    });
  });
});
