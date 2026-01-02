// ABOUTME: Unit tests for CompanyService following project patterns.
// ABOUTME: Tests cover CRUD operations, validation, and error handling scenarios.

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { CompanyService } from './CompanyService';
import { Company } from '../entity/Company';
import { CreateCompanyPayloadDto } from '../dto/CreateCompanyPayloadDto';
import { UpdateCompanyPayloadDto } from '../dto/UpdateCompanyPayloadDto';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { DEFAULT_COMPANY_SETTINGS } from '../interface/CompanySettings';

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
  findOneBy: jest.Mock;
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

describe('CompanyService', () => {
  let service: CompanyService;
  let companyRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };
  let mockEntityManager: MockEntityManager;

  const fakeCompany: Partial<Company> = {
    id: randomUUID(),
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-123-4567',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10001',
    taxId: '12-3456789',
    website: 'https://www.acme.com',
    logo: null,
    settings: DEFAULT_COMPANY_SETTINGS,
    status: 'active',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    companyRepo = createMockRepository();

    mockEntityManager = {
      findOneBy: jest.fn(),
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

    companyRepo.createQueryBuilder = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useValue: companyRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a company with default settings', async () => {
      const payload: CreateCompanyPayloadDto = {
        name: 'New Company',
        email: 'new@company.com',
      };

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      companyRepo.createQueryBuilder.mockReturnValue(qbMock);

      const savedCompany = { ...payload, id: randomUUID(), settings: DEFAULT_COMPANY_SETTINGS };
      companyRepo.create.mockReturnValue(savedCompany);
      companyRepo.save.mockResolvedValue(savedCompany);

      const result = await service.create(payload);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.settings).toEqual(DEFAULT_COMPANY_SETTINGS);
      expect(companyRepo.create).toHaveBeenCalled();
      expect(companyRepo.save).toHaveBeenCalled();
    });

    it('creates a company with custom settings merged with defaults', async () => {
      const payload: CreateCompanyPayloadDto = {
        name: 'Custom Company',
        email: 'custom@company.com',
        settings: { currency: 'EUR', taxRate: 16 } as any,
      };

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      companyRepo.createQueryBuilder.mockReturnValue(qbMock);

      const expectedSettings = { ...DEFAULT_COMPANY_SETTINGS, currency: 'EUR', taxRate: 16 };
      const savedCompany = { ...payload, id: randomUUID(), settings: expectedSettings };
      companyRepo.create.mockReturnValue(savedCompany);
      companyRepo.save.mockResolvedValue(savedCompany);

      const result = await service.create(payload);

      expect(result.settings.currency).toBe('EUR');
      expect(result.settings.taxRate).toBe(16);
      expect(result.settings.timezone).toBe(DEFAULT_COMPANY_SETTINGS.timezone);
    });

    it('throws ConflictException if email already exists', async () => {
      const payload: CreateCompanyPayloadDto = {
        name: 'Duplicate Company',
        email: 'existing@company.com',
      };

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'existing-id', email: 'existing@company.com' }),
      };
      companyRepo.createQueryBuilder.mockReturnValue(qbMock);

      await expect(service.create(payload)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated companies correctly', async () => {
      companyRepo.findAndCount.mockResolvedValue([[fakeCompany], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.docs).toEqual([fakeCompany]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.pages).toBe(1);
      expect(companyRepo.findAndCount).toHaveBeenCalledTimes(1);
    });

    it('applies filters correctly', async () => {
      companyRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10, name: 'Acme', status: 'active' });

      expect(companyRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
          }),
        }),
      );
    });

    it('calculates pagination correctly for multiple pages', async () => {
      companyRepo.findAndCount.mockResolvedValue([[fakeCompany], 25]);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.pages).toBe(3);
      expect(result.page).toBe(2);
    });
  });

  describe('findById', () => {
    it('returns company if exists', async () => {
      companyRepo.findOneBy.mockResolvedValue(fakeCompany);

      const result = await service.findById(fakeCompany.id as string);

      expect(result).toBeDefined();
      expect(result.id).toEqual(fakeCompany.id);
      expect(companyRepo.findOneBy).toHaveBeenCalledWith({ id: fakeCompany.id });
    });

    it('throws NotFoundException if company does not exist', async () => {
      companyRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateById', () => {
    it('updates company successfully and returns mapped entity', async () => {
      const id = randomUUID();
      companyRepo.existsBy.mockResolvedValue(true);

      const returnedRow = {
        id,
        name: 'Updated Company',
        email: 'updated@company.com',
        phone: '+1-555-999-8888',
        address: '456 Oak Street',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        postal_code: '90001',
        tax_id: '98-7654321',
        website: 'https://www.updated.com',
        logo: null,
        settings: DEFAULT_COMPANY_SETTINGS,
        status: 'active',
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

      const payload: UpdateCompanyPayloadDto = {
        name: 'Updated Company',
        updatedAt: new Date().toISOString(),
      };

      const result = await service.updateById(id, payload);

      expect(companyRepo.existsBy).toHaveBeenCalledWith({ id });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toEqual(id);
      expect(result.name).toEqual('Updated Company');
    });

    it('throws NotFoundException if company does not exist', async () => {
      const id = randomUUID();
      companyRepo.existsBy.mockResolvedValue(false);

      const payload: UpdateCompanyPayloadDto = {
        name: 'Updated Company',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(id, payload)).rejects.toThrow(NotFoundException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws OutdatedEntityVersionError when affected === 0', async () => {
      const id = randomUUID();
      companyRepo.existsBy.mockResolvedValue(true);

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 0,
        raw: [],
      });

      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const payload: UpdateCompanyPayloadDto = {
        name: 'Updated Company',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(id, payload)).rejects.toThrow(OutdatedEntityVersionError);
    });

    it('validates unique email when updating with new email', async () => {
      const id = randomUUID();
      companyRepo.existsBy.mockResolvedValue(true);

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'other-id', email: 'taken@company.com' }),
      };
      companyRepo.createQueryBuilder.mockReturnValue(qbMock);

      const payload: UpdateCompanyPayloadDto = {
        email: 'taken@company.com',
        updatedAt: new Date().toISOString(),
      };

      await expect(service.updateById(id, payload)).rejects.toThrow(ConflictException);
    });

    it('merges settings when updating partial settings', async () => {
      const id = randomUUID();
      companyRepo.existsBy.mockResolvedValue(true);

      const existingCompany = { ...fakeCompany, id, settings: DEFAULT_COMPANY_SETTINGS };
      mockEntityManager.findOneBy.mockResolvedValue(existingCompany);

      const returnedRow = {
        id,
        name: fakeCompany.name,
        email: fakeCompany.email,
        phone: fakeCompany.phone,
        address: fakeCompany.address,
        city: fakeCompany.city,
        state: fakeCompany.state,
        country: fakeCompany.country,
        postal_code: fakeCompany.postalCode,
        tax_id: fakeCompany.taxId,
        website: fakeCompany.website,
        logo: fakeCompany.logo,
        settings: { ...DEFAULT_COMPANY_SETTINGS, currency: 'EUR' },
        status: 'active',
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

      const payload: UpdateCompanyPayloadDto = {
        settings: { currency: 'EUR' } as any,
        updatedAt: new Date().toISOString(),
      };

      const result = await service.updateById(id, payload);

      expect(mockEntityManager.findOneBy).toHaveBeenCalledWith(Company, { id });
      expect(result.settings.currency).toBe('EUR');
    });
  });

  describe('remove', () => {
    it('deletes company successfully', async () => {
      companyRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove('some-id');

      expect(companyRepo.delete).toHaveBeenCalledWith('some-id');
    });

    it('throws NotFoundException if company does not exist', async () => {
      companyRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
