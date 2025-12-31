// ABOUTME: Service layer for Product entity handling CRUD operations.
// ABOUTME: Contains business logic for product management with multi-tenant isolation.

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource } from 'typeorm';
import { Product } from '../entity/Product';
import { CreateProductPayloadDto } from '../dto/CreateProductPayloadDto';
import { UpdateProductPayloadDto } from '../dto/UpdateProductPayloadDto';
import { FilterProductsQueryDto } from '../dto/FilterProductsQueryDto';
import { PaginatedResult } from '../../shared/interface/Pagination';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    companyId: string,
    payload: CreateProductPayloadDto,
  ): Promise<Product> {
    this.logger.log(`Creating product: ${payload.name} for company: ${companyId}`);

    await this.validateUniqueSku(companyId, payload.sku);

    const product = this.productRepository.create({
      ...payload,
      companyId,
    });

    const savedProduct = await this.productRepository.save(product);
    this.logger.log(`Product created successfully with id: ${savedProduct.id}`);
    return savedProduct;
  }

  async findAll(
    companyId: string,
    filterDto: FilterProductsQueryDto,
  ): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 10, ...filters } = filterDto;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(companyId, filters);

    const [items, totalItems] = await this.productRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return {
      docs: items,
      total: totalItems,
      page,
      pages: Math.ceil(totalItems / limit),
      limit,
    };
  }

  async findById(companyId: string, id: string): Promise<Product> {
    this.logger.debug(`Finding product by id: ${id} for company: ${companyId}`);
    const product = await this.productRepository.findOneBy({ id, companyId });

    if (!product) {
      this.logger.warn(`Product not found with id: ${id}`);
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateById(
    companyId: string,
    id: string,
    payload: UpdateProductPayloadDto,
  ): Promise<Product> {
    this.logger.log(`Updating product with id: ${id}`);
    const { updatedAt, ...data } = payload;

    const exists = await this.productRepository.existsBy({ id, companyId });
    if (!exists) {
      this.logger.warn(`Product not found for update with id: ${id}`);
      throw new NotFoundException('Product not found');
    }

    if (payload.sku) {
      await this.validateUniqueSku(companyId, payload.sku, id);
    }

    return this.dataSource.transaction(async (entityManager) => {
      const result = await entityManager
        .createQueryBuilder()
        .update(Product)
        .set(data)
        .where(
          'id = :id AND company_id = :companyId AND updated_at::timestamp(2) = :updatedAt::timestamp(2)',
          { id, companyId, updatedAt },
        )
        .returning('*')
        .execute();

      if (result.affected === 0) {
        this.logger.error(
          `Outdated version detected during update for product: ${id}`,
        );
        throw new OutdatedEntityVersionError(
          'An old version of Product was detected during the update',
          'Product',
          '409',
        );
      }

      const row = result.raw[0];
      return this.mapRowToEntity(row);
    });
  }

  async remove(companyId: string, id: string): Promise<void> {
    this.logger.log(`Deleting product with id: ${id}`);
    const result = await this.productRepository.delete({ id, companyId });

    if (result.affected === 0) {
      throw new NotFoundException('Product not found');
    }

    this.logger.log(`Product deleted successfully with id: ${id}`);
  }

  private buildWhere(
    companyId: string,
    filters: Omit<FilterProductsQueryDto, 'page' | 'limit'>,
  ): Record<string, any> {
    const where: Record<string, any> = { companyId };

    if (filters.name) {
      where.name = ILike(`%${filters.name}%`);
    }

    if (filters.sku) {
      where.sku = ILike(`%${filters.sku}%`);
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return where;
  }

  private async validateUniqueSku(
    companyId: string,
    sku: string,
    excludeId?: string,
  ): Promise<void> {
    const normalizedSku = sku.trim();

    const query = this.productRepository
      .createQueryBuilder('product')
      .where('product.company_id = :companyId', { companyId })
      .andWhere('product.sku = :sku', { sku: normalizedSku });

    if (excludeId) {
      query.andWhere('product.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();

    if (existing) {
      this.logger.warn(`Product with SKU ${sku} already exists for company`);
      throw new ConflictException('A product with this SKU already exists');
    }
  }

  private mapRowToEntity(row: any): Product {
    const entity = new Product();
    entity.id = row.id;
    entity.companyId = row.company_id;
    entity.sku = row.sku;
    entity.name = row.name;
    entity.description = row.description;
    entity.type = row.type;
    entity.category = row.category;
    entity.price = row.price;
    entity.cost = row.cost;
    entity.taxRate = row.tax_rate;
    entity.unit = row.unit;
    entity.trackInventory = row.track_inventory;
    entity.minStock = row.min_stock;
    entity.maxStock = row.max_stock;
    entity.image = row.image;
    entity.isActive = row.is_active;
    entity.createdAt = row.created_at;
    entity.updatedAt = row.updated_at;
    return entity;
  }
}
