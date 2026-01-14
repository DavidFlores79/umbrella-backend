// ABOUTME: Unit tests for ClientService following project patterns.
// ABOUTME: Tests cover CRUD operations with multi-tenant isolation, validation, and error handling.

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { ClientService } from './ClientService';
import { Client } from '../entity/Client';
import { CreateClientPayloadDto } from '../dto/CreateClientPayloadDto';
import { UpdateClientPayloadDto } from '../dto/UpdateClientPayloadDto';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';

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

describe('ClientService', () => {
  let service: ClientService;
  let clientRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };
  let mockEntityManager: MockEntityManager;

  const companyId = randomUUID();

  const fakeClient: Partial<Client> = {
    id: randomUUID(),
    companyId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10001',
    taxId: 'XAXX010101000',
    notes: 'VIP customer',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    clientRepo = createMockRepository();

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

    clientRepo.createQueryBuilder = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getRepositoryToken(Client),
          useValue: clientRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a client with companyId', async () => {
      const payload: CreateClientPayloadDto = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-987-6543',
      };

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      clientRepo.createQueryBuilder.mockReturnValue(qbMock);

      const savedClient = { ...payload, id: randomUUID(), companyId };
      clientRepo.create.mockReturnValue(savedClient);
      clientRepo.save.mockResolvedValue(savedClient);

      const result = await service.create(companyId, payload);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.companyId).toBe(companyId);
      expect(clientRepo.create).toHaveBeenCalledWith({
        ...payload,
        companyId,
      });
      expect(clientRepo.save).toHaveBeenCalled();
    });

    it('creates a client without email (no validation)', async () => {
      const payload: CreateClientPayloadDto = {
        name: 'Anonymous Client',
      };

      const savedClient = { ...payload, id: randomUUID(), companyId, email: null };
      clientRepo.create.mockReturnValue(savedClient);
      clientRepo.save.mockResolvedValue(savedClient);

      const result = await service.create(companyId, payload);

      expect(result).toBeDefined();
      expect(clientRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('throws ConflictException if email already exists for company', async () => {
      const payload: CreateClientPayloadDto = {
        name: 'Duplicate Client',
        email: 'existing@example.com',
      };

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'existing-id', email: 'existing@example.com' }),
      };
      clientRepo.createQueryBuilder.mockReturnValue(qbMock);

      await expect(service.create(companyId, payload)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated clients for company', async () => {
      clientRepo.findAndCount.mockResolvedValue([[fakeClient], 1]);

      const result = await service.findAll(companyId, { page: 1, limit: 10 });

      expect(result.docs).toEqual([fakeClient]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.pages).toBe(1);
      expect(clientRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId }),
        }),
      );
    });

    it('applies filters correctly', async () => {
      clientRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(companyId, {
        page: 1,
        limit: 10,
        name: 'John',
        isActive: true,
      });

      expect(clientRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId,
            isActive: true,
          }),
        }),
      );
    });

    it('calculates pagination correctly for multiple pages', async () => {
      clientRepo.findAndCount.mockResolvedValue([[fakeClient], 25]);

      const result = await service.findAll(companyId, { page: 2, limit: 10 });

      expect(result.pages).toBe(3);
      expect(result.page).toBe(2);
    });
  });

  describe('findById', () => {
    it('returns client if exists for company', async () => {
      clientRepo.findOneBy.mockResolvedValue(fakeClient);

      const result = await service.findById(companyId, fakeClient.id as string);

      expect(result).toBeDefined();
      expect(result.id).toEqual(fakeClient.id);
      expect(clientRepo.findOneBy).toHaveBeenCalledWith({
        id: fakeClient.id,
        companyId,
      });
    });

    it('throws NotFoundException if client does not exist', async () => {
      clientRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findById(companyId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateById', () => {
    it('updates client successfully', async () => {
      const id = randomUUID();
      clientRepo.existsBy.mockResolvedValue(true);

      const returnedRow = {
        id,
        company_id: companyId,
        name: 'Updated Client',
        email: 'updated@example.com',
        phone: '+1-555-999-8888',
        address: '456 Oak Street',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        postal_code: '90001',
        tax_id: '98-7654321',
        notes: 'Updated notes',
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

      const payload: UpdateClientPayloadDto = {
        name: 'Updated Client',
        updatedAt: new Date().toISOString(),
      };

      const result = await service.updateById(companyId, id, payload);

      expect(clientRepo.existsBy).toHaveBeenCalledWith({ id, companyId });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toEqual(id);
      expect(result.name).toEqual('Updated Client');
    });

    it('throws NotFoundException if client does not exist', async () => {
      const id = randomUUID();
      clientRepo.existsBy.mockResolvedValue(false);

      const payload: UpdateClientPayloadDto = {
        name: 'Updated Client',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws OutdatedEntityVersionError when affected === 0', async () => {
      const id = randomUUID();
      clientRepo.existsBy.mockResolvedValue(true);

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 0,
        raw: [],
      });

      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const payload: UpdateClientPayloadDto = {
        name: 'Updated Client',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        OutdatedEntityVersionError,
      );
    });

    it('validates unique email when updating', async () => {
      const id = randomUUID();
      clientRepo.existsBy.mockResolvedValue(true);

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'other-id', email: 'taken@example.com' }),
      };
      clientRepo.createQueryBuilder.mockReturnValue(qbMock);

      const payload: UpdateClientPayloadDto = {
        email: 'taken@example.com',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(companyId, id, payload)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deletes client successfully', async () => {
      clientRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(companyId, 'some-id');

      expect(clientRepo.delete).toHaveBeenCalledWith({ id: 'some-id', companyId });
    });

    it('throws NotFoundException if client does not exist', async () => {
      clientRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(companyId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
