// ABOUTME: Service layer for Company entity handling CRUD operations.
// ABOUTME: Contains business logic for company management including validation and transactions.

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource } from 'typeorm';
import { Company } from '../entity/Company';
import { CreateCompanyPayloadDto } from '../dto/CreateCompanyPayloadDto';
import { UpdateCompanyPayloadDto } from '../dto/UpdateCompanyPayloadDto';
import { FilterCompaniesQueryDto } from '../dto/FilterCompaniesQueryDto';
import { PaginatedResult } from '../../shared/interface/Pagination';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { DEFAULT_COMPANY_SETTINGS } from '../interface/CompanySettings';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: CreateCompanyPayloadDto): Promise<Company> {
    this.logger.log(`Creating company: ${payload.name}`);

    await this.validateUniqueEmail(payload.email);

    const settings = payload.settings
      ? { ...DEFAULT_COMPANY_SETTINGS, ...payload.settings }
      : DEFAULT_COMPANY_SETTINGS;

    const company = this.companyRepository.create({
      ...payload,
      settings,
    });

    const savedCompany = await this.companyRepository.save(company);
    this.logger.log(`Company created successfully with id: ${savedCompany.id}`);
    return savedCompany;
  }

  async findAll(
    filterDto: FilterCompaniesQueryDto,
  ): Promise<PaginatedResult<Company>> {
    const { page = 1, limit = 10, ...filters } = filterDto;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters);

    const [items, totalItems] = await this.companyRepository.findAndCount({
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

  async findById(id: string): Promise<Company> {
    this.logger.debug(`Finding company by id: ${id}`);
    const company = await this.companyRepository.findOneBy({ id });

    if (!company) {
      this.logger.warn(`Company not found with id: ${id}`);
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async updateById(
    id: string,
    payload: UpdateCompanyPayloadDto,
  ): Promise<Company> {
    this.logger.log(`Updating company with id: ${id}`);
    const { updatedAt, settings, ...data } = payload;

    const exists = await this.companyRepository.existsBy({ id });
    if (!exists) {
      this.logger.warn(`Company not found for update with id: ${id}`);
      throw new NotFoundException('Company not found');
    }

    if (payload.email) {
      await this.validateUniqueEmail(payload.email, id);
    }

    return this.dataSource.transaction(async (entityManager) => {
      const updateData: Partial<Company> = { ...data };

      if (settings) {
        const existingCompany = await entityManager.findOneBy(Company, { id });
        if (existingCompany) {
          updateData.settings = { ...existingCompany.settings, ...settings };
        }
      }

      const result = await entityManager
        .createQueryBuilder()
        .update(Company)
        .set(updateData)
        .where(
          'id = :id AND updated_at::timestamp(2) = :updatedAt::timestamp(2)',
          { id, updatedAt },
        )
        .returning('*')
        .execute();

      if (result.affected === 0) {
        this.logger.error(
          `Outdated version detected during update for company: ${id}`,
        );
        throw new OutdatedEntityVersionError(
          'An old version of Company was detected during the update',
          'Company',
          '409',
        );
      }

      const row = (result.raw as Record<string, unknown>[])[0];
      return this.mapRowToEntity(row);
    });
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting company with id: ${id}`);
    const result = await this.companyRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Company not found');
    }

    this.logger.log(`Company deleted successfully with id: ${id}`);
  }

  private buildWhere(
    filters: Omit<FilterCompaniesQueryDto, 'page' | 'limit'>,
  ): Record<string, any> {
    const where: Record<string, any> = {};

    if (filters.name) {
      where.name = ILike(`%${filters.name}%`);
    }

    if (filters.email) {
      where.email = ILike(`%${filters.email}%`);
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return where;
  }

  private async validateUniqueEmail(
    email: string,
    excludeId?: string,
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    const query = this.companyRepository
      .createQueryBuilder('company')
      .where('LOWER(company.email) = :email', { email: normalizedEmail });

    if (excludeId) {
      query.andWhere('company.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();

    if (existing) {
      this.logger.warn(`Company with email ${email} already exists`);
      throw new ConflictException('A company with this email already exists');
    }
  }

  private mapRowToEntity(row: Record<string, unknown>): Company {
    const entity = new Company();
    entity.id = row.id as string;
    entity.name = row.name as string;
    entity.email = row.email as string;
    entity.phone = row.phone as string | null;
    entity.address = row.address as string | null;
    entity.city = row.city as string | null;
    entity.state = row.state as string | null;
    entity.country = row.country as string | null;
    entity.postalCode = row.postal_code as string | null;
    entity.taxId = row.tax_id as string | null;
    entity.website = row.website as string | null;
    entity.logo = row.logo as string | null;
    entity.settings = row.settings as Company['settings'];
    entity.status = row.status as Company['status'];
    entity.isActive = row.is_active as boolean;
    entity.createdAt = row.created_at as Date;
    entity.updatedAt = row.updated_at as Date;
    return entity;
  }
}
