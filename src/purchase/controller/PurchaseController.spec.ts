// ABOUTME: Unit tests for PurchaseController following project patterns.
// ABOUTME: Tests cover all CRUD endpoints with company context and DTO transformation.

import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';

import { PurchaseController } from './PurchaseController';
import { PurchaseService } from '../service/PurchaseService';
import { Purchase } from '../entity/Purchase';
import { PurchaseLineItem } from '../entity/PurchaseLineItem';
import { PurchaseDto } from '../dto/PurchaseDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { CreatePurchasePayloadDto } from '../dto/CreatePurchasePayloadDto';
import { UpdatePurchasePayloadDto, UpdatePurchaseStatusDto } from '../dto/UpdatePurchasePayloadDto';
import { PurchaseStatus } from '../enum/PurchaseStatus';
import { JwtAuthGuard } from '../../shared/guard/JwtAuthGuard';
import { CompanyContextGuard } from '../../shared/guard/CompanyContextGuard';
import { PermissionsGuard } from '../../shared/guard/PermissionsGuard';

describe('PurchaseController', () => {
  let controller: PurchaseController;

  const mockPurchaseService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };

  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  const companyId = randomUUID();
  const vendorId = randomUUID();

  const fakeLineItem: PurchaseLineItem = {
    id: randomUUID(),
    purchaseId: randomUUID(),
    productId: null,
    description: 'Test Product',
    quantity: 2,
    unitCost: 50,
    taxRate: 16,
    subtotal: 100,
    taxAmount: 16,
    total: 116,
    quantityReceived: 0,
  } as PurchaseLineItem;

  const fakePurchase: Purchase = {
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
    lineItems: [fakeLineItem],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Purchase;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseController],
      providers: [
        {
          provide: PurchaseService,
          useValue: mockPurchaseService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(CompanyContextGuard)
      .useValue(mockGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<PurchaseController>(PurchaseController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns paginated purchases as DTOs', async () => {
      mockPurchaseService.findAll.mockResolvedValue({
        docs: [fakePurchase],
        total: 1,
        page: 1,
        pages: 1,
        limit: 10,
      });

      const result: PaginationResultDto<PurchaseDto> = await controller.findAll(
        companyId,
        { page: 1, limit: 10 },
      );

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]).toBeInstanceOf(PurchaseDto);
      expect(result.docs[0].id).toBe(fakePurchase.id);
      expect(result.docs[0].poNumber).toBe(fakePurchase.poNumber);
      expect(result.docs[0].lineItems).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPurchaseService.findAll).toHaveBeenCalledWith(companyId, {
        page: 1,
        limit: 10,
      });
    });

    it('passes filters to service', async () => {
      mockPurchaseService.findAll.mockResolvedValue({
        docs: [],
        total: 0,
        page: 1,
        pages: 0,
        limit: 10,
      });

      await controller.findAll(companyId, {
        page: 1,
        limit: 10,
        status: PurchaseStatus.ORDERED,
        vendorId,
      });

      expect(mockPurchaseService.findAll).toHaveBeenCalledWith(companyId, {
        page: 1,
        limit: 10,
        status: PurchaseStatus.ORDERED,
        vendorId,
      });
    });
  });

  describe('getById', () => {
    it('returns a PurchaseDto with line items if found', async () => {
      mockPurchaseService.findById.mockResolvedValue(fakePurchase);

      const result = await controller.getById(companyId, fakePurchase.id);

      expect(result).toBeInstanceOf(PurchaseDto);
      expect(result.id).toEqual(fakePurchase.id);
      expect(result.poNumber).toEqual(fakePurchase.poNumber);
      expect(result.lineItems).toHaveLength(1);
      expect(mockPurchaseService.findById).toHaveBeenCalledWith(companyId, fakePurchase.id);
    });
  });

  describe('create', () => {
    it('returns a PurchaseDto after creation', async () => {
      mockPurchaseService.create.mockResolvedValue(fakePurchase);

      const payload: CreatePurchasePayloadDto = {
        vendorId,
        orderDate: '2024-01-15',
        lineItems: [
          {
            description: 'Test Product',
            quantity: 2,
            unitCost: 50,
            taxRate: 16,
          },
        ],
      };

      const result = await controller.create(companyId, payload);

      expect(result).toBeInstanceOf(PurchaseDto);
      expect(result.poNumber).toBe(fakePurchase.poNumber);
      expect(result.total).toBe(fakePurchase.total);
      expect(mockPurchaseService.create).toHaveBeenCalledWith(companyId, payload);
    });
  });

  describe('updateById', () => {
    it('returns updated PurchaseDto', async () => {
      const updatedPurchase = { ...fakePurchase, notes: 'Updated notes' };
      mockPurchaseService.updateById.mockResolvedValue(updatedPurchase);

      const payload: UpdatePurchasePayloadDto = {
        notes: 'Updated notes',
        updatedAt: new Date().toISOString(),
      };

      const result = await controller.updateById(companyId, fakePurchase.id, payload);

      expect(result).toBeInstanceOf(PurchaseDto);
      expect(result.notes).toBe('Updated notes');
      expect(mockPurchaseService.updateById).toHaveBeenCalledWith(
        companyId,
        fakePurchase.id,
        payload,
      );
    });
  });

  describe('updateStatus', () => {
    it('returns PurchaseDto with updated status', async () => {
      const updatedPurchase = { ...fakePurchase, status: PurchaseStatus.RECEIVED };
      mockPurchaseService.updateStatus.mockResolvedValue(updatedPurchase);

      const payload: UpdatePurchaseStatusDto = {
        status: PurchaseStatus.RECEIVED,
        updatedAt: new Date().toISOString(),
      };

      const result = await controller.updateStatus(companyId, fakePurchase.id, payload);

      expect(result).toBeInstanceOf(PurchaseDto);
      expect(result.status).toBe(PurchaseStatus.RECEIVED);
      expect(mockPurchaseService.updateStatus).toHaveBeenCalledWith(
        companyId,
        fakePurchase.id,
        payload,
      );
    });
  });

  describe('deleteById', () => {
    it('calls remove service method', async () => {
      mockPurchaseService.remove.mockResolvedValue(undefined);

      await controller.deleteById(companyId, fakePurchase.id);

      expect(mockPurchaseService.remove).toHaveBeenCalledWith(companyId, fakePurchase.id);
    });
  });
});
