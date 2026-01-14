// ABOUTME: Unit tests for ProductController following project patterns.
// ABOUTME: Tests cover all CRUD endpoints with company context and DTO transformation.

import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';

import { ProductController } from './ProductController';
import { ProductService } from '../service/ProductService';
import { Product } from '../entity/Product';
import { ProductDto } from '../dto/ProductDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { CreateProductPayloadDto } from '../dto/CreateProductPayloadDto';
import { UpdateProductPayloadDto } from '../dto/UpdateProductPayloadDto';
import { ProductType, ProductCategory } from '../enum/ProductType';

describe('ProductController', () => {
  let controller: ProductController;

  const mockProductService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    remove: jest.fn(),
  };

  const companyId = randomUUID();

  const fakeProduct: Product = {
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
  } as Product;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns paginated products as DTOs', async () => {
      mockProductService.findAll.mockResolvedValue({
        docs: [fakeProduct],
        total: 1,
        page: 1,
        pages: 1,
        limit: 10,
      });

      const result: PaginationResultDto<ProductDto> = await controller.findAll(
        companyId,
        { page: 1, limit: 10 },
      );

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]).toBeInstanceOf(ProductDto);
      expect(result.docs[0].id).toBe(fakeProduct.id);
      expect(result.docs[0].name).toBe(fakeProduct.name);
      expect(result.docs[0].companyId).toBe(companyId);
      expect(result.total).toBe(1);
      expect(mockProductService.findAll).toHaveBeenCalledWith(companyId, {
        page: 1,
        limit: 10,
      });
    });

    it('passes filters to service', async () => {
      mockProductService.findAll.mockResolvedValue({
        docs: [],
        total: 0,
        page: 1,
        pages: 0,
        limit: 10,
      });

      await controller.findAll(companyId, {
        page: 1,
        limit: 10,
        name: 'Mouse',
        type: ProductType.PRODUCT,
      });

      expect(mockProductService.findAll).toHaveBeenCalledWith(companyId, {
        page: 1,
        limit: 10,
        name: 'Mouse',
        type: ProductType.PRODUCT,
      });
    });
  });

  describe('getById', () => {
    it('returns a ProductDto if found', async () => {
      mockProductService.findById.mockResolvedValue(fakeProduct);

      const result = await controller.getById(companyId, fakeProduct.id);

      expect(result).toBeInstanceOf(ProductDto);
      expect(result.id).toEqual(fakeProduct.id);
      expect(result.name).toEqual(fakeProduct.name);
      expect(result.sku).toEqual(fakeProduct.sku);
      expect(result.price).toEqual(fakeProduct.price);
      expect(mockProductService.findById).toHaveBeenCalledWith(companyId, fakeProduct.id);
    });
  });

  describe('create', () => {
    it('returns a ProductDto after creation', async () => {
      mockProductService.create.mockResolvedValue(fakeProduct);

      const payload: CreateProductPayloadDto = {
        sku: 'PROD-001',
        name: 'Wireless Mouse',
        price: 29.99,
        type: ProductType.PRODUCT,
        category: ProductCategory.ELECTRONICS,
      };

      const result = await controller.create(companyId, payload);

      expect(result).toBeInstanceOf(ProductDto);
      expect(result.name).toBe(fakeProduct.name);
      expect(result.sku).toBe(fakeProduct.sku);
      expect(mockProductService.create).toHaveBeenCalledWith(companyId, payload);
    });
  });

  describe('updateById', () => {
    it('returns updated ProductDto', async () => {
      const updatedProduct = { ...fakeProduct, name: 'Updated Mouse', price: 39.99 };
      mockProductService.updateById.mockResolvedValue(updatedProduct);

      const payload: UpdateProductPayloadDto = {
        name: 'Updated Mouse',
        price: 39.99,
        updatedAt: new Date().toISOString(),
      };

      const result = await controller.updateById(companyId, fakeProduct.id, payload);

      expect(result).toBeInstanceOf(ProductDto);
      expect(result.name).toBe('Updated Mouse');
      expect(result.price).toBe(39.99);
      expect(mockProductService.updateById).toHaveBeenCalledWith(
        companyId,
        fakeProduct.id,
        payload,
      );
    });
  });

  describe('deleteById', () => {
    it('calls remove service method', async () => {
      mockProductService.remove.mockResolvedValue(undefined);

      await controller.deleteById(companyId, fakeProduct.id);

      expect(mockProductService.remove).toHaveBeenCalledWith(companyId, fakeProduct.id);
    });
  });
});
