// ABOUTME: Unit tests for ProductService following project patterns.
// ABOUTME: Tests cover CRUD operations with multi-tenant isolation, validation, and error handling.

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { ProductService } from './ProductService';
import { Product } from '../entity/Product';
import { CreateProductPayloadDto } from '../dto/CreateProductPayloadDto';
import { UpdateProductPayloadDto } from '../dto/UpdateProductPayloadDto';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { ProductType, ProductCategory } from '../enum/ProductType';

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

describe('ProductService', () => {
  let service: ProductService;
  let productRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };
  let mockEntityManager: MockEntityManager;

  const companyId = randomUUID();

  const fakeProduct: Partial<Product> = {
    id: randomUUID(),
    companyId,
    sku: 'PROD-001',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    type: ProductType.PRODUCT,
    category: ProductCategory.ELECTRONICS,
    price: 29.99,
    cost: 15.0,
    taxRate: 16,
    unit: 'pcs',
    trackInventory: true,
    minStock: 10,
    maxStock: 1000,
    image: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    productRepo = createMockRepository();

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

    productRepo.createQueryBuilder = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a product with companyId', async () => {
      const payload: CreateProductPayloadDto = {
        sku: 'PROD-002',
        name: 'New Product',
        price: 49.99,
        type: ProductType.PRODUCT,
        category: ProductCategory.ELECTRONICS,
      };

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      productRepo.createQueryBuilder.mockReturnValue(qbMock);

      const savedProduct = { ...payload, id: randomUUID(), companyId };
      productRepo.create.mockReturnValue(savedProduct);
      productRepo.save.mockResolvedValue(savedProduct);

      const result = await service.create(companyId, payload);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.companyId).toBe(companyId);
      expect(productRepo.create).toHaveBeenCalledWith({
        ...payload,
        companyId,
      });
      expect(productRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException if SKU already exists for company', async () => {
      const payload: CreateProductPayloadDto = {
        sku: 'EXISTING-SKU',
        name: 'Duplicate SKU Product',
        price: 19.99,
        type: ProductType.PRODUCT,
        category: ProductCategory.OTHER,
      };

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'existing-id', sku: 'EXISTING-SKU' }),
      };
      productRepo.createQueryBuilder.mockReturnValue(qbMock);

      await expect(service.create(companyId, payload)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated products for company', async () => {
      productRepo.findAndCount.mockResolvedValue([[fakeProduct], 1]);

      const result = await service.findAll(companyId, { page: 1, limit: 10 });

      expect(result.docs).toEqual([fakeProduct]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.pages).toBe(1);
      expect(productRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId }),
        }),
      );
    });

    it('applies filters correctly', async () => {
      productRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(companyId, {
        page: 1,
        limit: 10,
        name: 'Mouse',
        type: ProductType.PRODUCT,
        category: ProductCategory.ELECTRONICS,
        isActive: true,
      });

      expect(productRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId,
            type: ProductType.PRODUCT,
            category: ProductCategory.ELECTRONICS,
            isActive: true,
          }),
        }),
      );
    });

    it('calculates pagination correctly for multiple pages', async () => {
      productRepo.findAndCount.mockResolvedValue([[fakeProduct], 25]);

      const result = await service.findAll(companyId, { page: 2, limit: 10 });

      expect(result.pages).toBe(3);
      expect(result.page).toBe(2);
    });
  });

  describe('findById', () => {
    it('returns product if exists for company', async () => {
      productRepo.findOneBy.mockResolvedValue(fakeProduct);

      const result = await service.findById(companyId, fakeProduct.id as string);

      expect(result).toBeDefined();
      expect(result.id).toEqual(fakeProduct.id);
      expect(productRepo.findOneBy).toHaveBeenCalledWith({
        id: fakeProduct.id,
        companyId,
      });
    });

    it('throws NotFoundException if product does not exist', async () => {
      productRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findById(companyId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateById', () => {
    it('updates product successfully', async () => {
      const id = randomUUID();
      productRepo.existsBy.mockResolvedValue(true);

      const returnedRow = {
        id,
        company_id: companyId,
        sku: 'PROD-001',
        name: 'Updated Product',
        description: 'Updated description',
        type: ProductType.PRODUCT,
        category: ProductCategory.ELECTRONICS,
        price: 39.99,
        cost: 20.0,
        tax_rate: 16,
        unit: 'pcs',
        track_inventory: true,
        min_stock: 10,
        max_stock: 1000,
        image: null,
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

      const payload: UpdateProductPayloadDto = {
        name: 'Updated Product',
        price: 39.99,
        updatedAt: new Date().toISOString(),
      };

      const result = await service.updateById(companyId, id, payload);

      expect(productRepo.existsBy).toHaveBeenCalledWith({ id, companyId });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toEqual(id);
      expect(result.name).toEqual('Updated Product');
    });

    it('throws NotFoundException if product does not exist', async () => {
      const id = randomUUID();
      productRepo.existsBy.mockResolvedValue(false);

      const payload: UpdateProductPayloadDto = {
        name: 'Updated Product',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws OutdatedEntityVersionError when affected === 0', async () => {
      const id = randomUUID();
      productRepo.existsBy.mockResolvedValue(true);

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 0,
        raw: [],
      });

      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const payload: UpdateProductPayloadDto = {
        name: 'Updated Product',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        OutdatedEntityVersionError,
      );
    });

    it('validates unique SKU when updating', async () => {
      const id = randomUUID();
      productRepo.existsBy.mockResolvedValue(true);

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'other-id', sku: 'TAKEN-SKU' }),
      };
      productRepo.createQueryBuilder.mockReturnValue(qbMock);

      const payload: UpdateProductPayloadDto = {
        sku: 'TAKEN-SKU',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deletes product successfully', async () => {
      productRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(companyId, 'some-id');

      expect(productRepo.delete).toHaveBeenCalledWith({ id: 'some-id', companyId });
    });

    it('throws NotFoundException if product does not exist', async () => {
      productRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(companyId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
