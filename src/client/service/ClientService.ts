// ABOUTME: Service layer for Client entity handling CRUD operations.
// ABOUTME: Contains business logic for client management with multi-tenant isolation.

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource } from 'typeorm';
import { Client } from '../entity/Client';
import { CreateClientPayloadDto } from '../dto/CreateClientPayloadDto';
import { UpdateClientPayloadDto } from '../dto/UpdateClientPayloadDto';
import { FilterClientsQueryDto } from '../dto/FilterClientsQueryDto';
import { PaginatedResult } from '../../shared/interface/Pagination';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    companyId: string,
    payload: CreateClientPayloadDto,
  ): Promise<Client> {
    this.logger.log(
      `Creating client: ${payload.name} for company: ${companyId}`,
    );

    if (payload.email) {
      await this.validateUniqueEmail(companyId, payload.email);
    }

    const client = this.clientRepository.create({
      ...payload,
      companyId,
    });

    const savedClient = await this.clientRepository.save(client);
    this.logger.log(`Client created successfully with id: ${savedClient.id}`);
    return savedClient;
  }

  async findAll(
    companyId: string,
    filterDto: FilterClientsQueryDto,
  ): Promise<PaginatedResult<Client>> {
    const { page = 1, limit = 10, ...filters } = filterDto;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(companyId, filters);

    const [items, totalItems] = await this.clientRepository.findAndCount({
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

  async findById(companyId: string, id: string): Promise<Client> {
    this.logger.debug(`Finding client by id: ${id} for company: ${companyId}`);
    const client = await this.clientRepository.findOneBy({ id, companyId });

    if (!client) {
      this.logger.warn(`Client not found with id: ${id}`);
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async updateById(
    companyId: string,
    id: string,
    payload: UpdateClientPayloadDto,
  ): Promise<Client> {
    this.logger.log(`Updating client with id: ${id}`);
    const { updatedAt, ...data } = payload;

    const exists = await this.clientRepository.existsBy({ id, companyId });
    if (!exists) {
      this.logger.warn(`Client not found for update with id: ${id}`);
      throw new NotFoundException('Client not found');
    }

    if (payload.email) {
      await this.validateUniqueEmail(companyId, payload.email, id);
    }

    return this.dataSource.transaction(async (entityManager) => {
      const result = await entityManager
        .createQueryBuilder()
        .update(Client)
        .set(data)
        .where(
          'id = :id AND company_id = :companyId AND updated_at::timestamp(2) = :updatedAt::timestamp(2)',
          { id, companyId, updatedAt },
        )
        .returning('*')
        .execute();

      if (result.affected === 0) {
        this.logger.error(
          `Outdated version detected during update for client: ${id}`,
        );
        throw new OutdatedEntityVersionError(
          'An old version of Client was detected during the update',
          'Client',
          '409',
        );
      }

      const row = (result.raw as Record<string, unknown>[])[0];
      return this.mapRowToEntity(row);
    });
  }

  async remove(companyId: string, id: string): Promise<void> {
    this.logger.log(`Deleting client with id: ${id}`);
    const result = await this.clientRepository.delete({ id, companyId });

    if (result.affected === 0) {
      throw new NotFoundException('Client not found');
    }

    this.logger.log(`Client deleted successfully with id: ${id}`);
  }

  private buildWhere(
    companyId: string,
    filters: Omit<FilterClientsQueryDto, 'page' | 'limit'>,
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

    const query = this.clientRepository
      .createQueryBuilder('client')
      .where('client.company_id = :companyId', { companyId })
      .andWhere('LOWER(client.email) = :email', { email: normalizedEmail });

    if (excludeId) {
      query.andWhere('client.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();

    if (existing) {
      this.logger.warn(`Client with email ${email} already exists for company`);
      throw new ConflictException('A client with this email already exists');
    }
  }

  private mapRowToEntity(row: Record<string, unknown>): Client {
    const entity = new Client();
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
    entity.notes = row.notes as string | null;
    entity.isActive = row.is_active as boolean;
    entity.createdAt = row.created_at as Date;
    entity.updatedAt = row.updated_at as Date;
    return entity;
  }
}
