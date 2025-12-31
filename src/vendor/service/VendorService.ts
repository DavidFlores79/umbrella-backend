// ABOUTME: Service layer for Vendor entity handling CRUD operations.
// ABOUTME: Contains business logic for vendor management with multi-tenant isolation.

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource } from 'typeorm';
import { Vendor } from '../entity/Vendor';
import { CreateVendorPayloadDto } from '../dto/CreateVendorPayloadDto';
import { UpdateVendorPayloadDto } from '../dto/UpdateVendorPayloadDto';
import { FilterVendorsQueryDto } from '../dto/FilterVendorsQueryDto';
import { PaginatedResult } from '../../shared/interface/Pagination';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    companyId: string,
    payload: CreateVendorPayloadDto,
  ): Promise<Vendor> {
    this.logger.log(
      `Creating vendor: ${payload.name} for company: ${companyId}`,
    );

    if (payload.email) {
      await this.validateUniqueEmail(companyId, payload.email);
    }

    const vendor = this.vendorRepository.create({
      ...payload,
      companyId,
    });

    const savedVendor = await this.vendorRepository.save(vendor);
    this.logger.log(`Vendor created successfully with id: ${savedVendor.id}`);
    return savedVendor;
  }

  async findAll(
    companyId: string,
    filterDto: FilterVendorsQueryDto,
  ): Promise<PaginatedResult<Vendor>> {
    const { page = 1, limit = 10, ...filters } = filterDto;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(companyId, filters);

    const [items, totalItems] = await this.vendorRepository.findAndCount({
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

  async findById(companyId: string, id: string): Promise<Vendor> {
    this.logger.debug(`Finding vendor by id: ${id} for company: ${companyId}`);
    const vendor = await this.vendorRepository.findOneBy({ id, companyId });

    if (!vendor) {
      this.logger.warn(`Vendor not found with id: ${id}`);
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async updateById(
    companyId: string,
    id: string,
    payload: UpdateVendorPayloadDto,
  ): Promise<Vendor> {
    this.logger.log(`Updating vendor with id: ${id}`);
    const { updatedAt, ...data } = payload;

    const exists = await this.vendorRepository.existsBy({ id, companyId });
    if (!exists) {
      this.logger.warn(`Vendor not found for update with id: ${id}`);
      throw new NotFoundException('Vendor not found');
    }

    if (payload.email) {
      await this.validateUniqueEmail(companyId, payload.email, id);
    }

    return this.dataSource.transaction(async (entityManager) => {
      const result = await entityManager
        .createQueryBuilder()
        .update(Vendor)
        .set(data)
        .where(
          'id = :id AND company_id = :companyId AND updated_at::timestamp(2) = :updatedAt::timestamp(2)',
          { id, companyId, updatedAt },
        )
        .returning('*')
        .execute();

      if (result.affected === 0) {
        this.logger.error(
          `Outdated version detected during update for vendor: ${id}`,
        );
        throw new OutdatedEntityVersionError(
          'An old version of Vendor was detected during the update',
          'Vendor',
          '409',
        );
      }

      const row = (result.raw as Record<string, unknown>[])[0];
      return this.mapRowToEntity(row);
    });
  }

  async remove(companyId: string, id: string): Promise<void> {
    this.logger.log(`Deleting vendor with id: ${id}`);
    const result = await this.vendorRepository.delete({ id, companyId });

    if (result.affected === 0) {
      throw new NotFoundException('Vendor not found');
    }

    this.logger.log(`Vendor deleted successfully with id: ${id}`);
  }

  private buildWhere(
    companyId: string,
    filters: Omit<FilterVendorsQueryDto, 'page' | 'limit'>,
  ): Record<string, any> {
    const where: Record<string, any> = { companyId };

    if (filters.name) {
      where.name = ILike(`%${filters.name}%`);
    }

    if (filters.email) {
      where.email = ILike(`%${filters.email}%`);
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return where;
  }

  private async validateUniqueEmail(
    companyId: string,
    email: string,
    excludeId?: string,
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    const query = this.vendorRepository
      .createQueryBuilder('vendor')
      .where('vendor.company_id = :companyId', { companyId })
      .andWhere('LOWER(vendor.email) = :email', { email: normalizedEmail });

    if (excludeId) {
      query.andWhere('vendor.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();

    if (existing) {
      this.logger.warn(`Vendor with email ${email} already exists for company`);
      throw new ConflictException('A vendor with this email already exists');
    }
  }

  private mapRowToEntity(row: Record<string, unknown>): Vendor {
    const entity = new Vendor();
    entity.id = row.id as string;
    entity.companyId = row.company_id as string;
    entity.name = row.name as string;
    entity.email = row.email as string | null;
    entity.phone = row.phone as string | null;
    entity.address = row.address as string | null;
    entity.city = row.city as string | null;
    entity.state = row.state as string | null;
    entity.country = row.country as string | null;
    entity.postalCode = row.postal_code as string | null;
    entity.taxId = row.tax_id as string | null;
    entity.contactName = row.contact_name as string | null;
    entity.notes = row.notes as string | null;
    entity.isActive = row.is_active as boolean;
    entity.createdAt = row.created_at as Date;
    entity.updatedAt = row.updated_at as Date;
    return entity;
  }
}
