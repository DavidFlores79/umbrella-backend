// ABOUTME: Unit tests for ClientController following project patterns.
// ABOUTME: Tests cover all CRUD endpoints with company context and DTO transformation.

import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';

import { ClientController } from './ClientController';
import { ClientService } from '../service/ClientService';
import { Client } from '../entity/Client';
import { ClientDto } from '../dto/ClientDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { CreateClientPayloadDto } from '../dto/CreateClientPayloadDto';
import { UpdateClientPayloadDto } from '../dto/UpdateClientPayloadDto';
import { JwtAuthGuard } from '../../shared/guard/JwtAuthGuard';
import { CompanyContextGuard } from '../../shared/guard/CompanyContextGuard';
import { PermissionsGuard } from '../../shared/guard/PermissionsGuard';

describe('ClientController', () => {
  let controller: ClientController;

  const mockClientService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    remove: jest.fn(),
  };

  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  const companyId = randomUUID();

  const fakeClient: Client = {
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
  } as Client;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: ClientService,
          useValue: mockClientService,
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

    controller = module.get<ClientController>(ClientController);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns paginated clients as DTOs', async () => {
      mockClientService.findAll.mockResolvedValue({
        docs: [fakeClient],
        total: 1,
        page: 1,
        pages: 1,
        limit: 10,
      });

      const result: PaginationResultDto<ClientDto> = await controller.findAll(
        companyId,
        { page: 1, limit: 10 },
      );

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]).toBeInstanceOf(ClientDto);
      expect(result.docs[0].id).toBe(fakeClient.id);
      expect(result.docs[0].name).toBe(fakeClient.name);
      expect(result.docs[0].companyId).toBe(companyId);
      expect(result.total).toBe(1);
      expect(mockClientService.findAll).toHaveBeenCalledWith(companyId, {
        page: 1,
        limit: 10,
      });
    });

    it('passes filters to service', async () => {
      mockClientService.findAll.mockResolvedValue({
        docs: [],
        total: 0,
        page: 1,
        pages: 0,
        limit: 10,
      });

      await controller.findAll(companyId, {
        page: 1,
        limit: 10,
        name: 'John',
        isActive: true,
      });

      expect(mockClientService.findAll).toHaveBeenCalledWith(companyId, {
        page: 1,
        limit: 10,
        name: 'John',
        isActive: true,
      });
    });
  });

  describe('getById', () => {
    it('returns a ClientDto if found', async () => {
      mockClientService.findById.mockResolvedValue(fakeClient);

      const result = await controller.getById(companyId, fakeClient.id);

      expect(result).toBeInstanceOf(ClientDto);
      expect(result.id).toEqual(fakeClient.id);
      expect(result.name).toEqual(fakeClient.name);
      expect(result.email).toEqual(fakeClient.email);
      expect(mockClientService.findById).toHaveBeenCalledWith(companyId, fakeClient.id);
    });
  });

  describe('create', () => {
    it('returns a ClientDto after creation', async () => {
      mockClientService.create.mockResolvedValue(fakeClient);

      const payload: CreateClientPayloadDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
      };

      const result = await controller.create(companyId, payload);

      expect(result).toBeInstanceOf(ClientDto);
      expect(result.name).toBe(fakeClient.name);
      expect(result.email).toBe(fakeClient.email);
      expect(mockClientService.create).toHaveBeenCalledWith(companyId, payload);
    });
  });

  describe('updateById', () => {
    it('returns updated ClientDto', async () => {
      const updatedClient = { ...fakeClient, name: 'John Updated' };
      mockClientService.updateById.mockResolvedValue(updatedClient);

      const payload: UpdateClientPayloadDto = {
        name: 'John Updated',
        updatedAt: new Date().toISOString(),
      };

      const result = await controller.updateById(companyId, fakeClient.id, payload);

      expect(result).toBeInstanceOf(ClientDto);
      expect(result.name).toBe('John Updated');
      expect(mockClientService.updateById).toHaveBeenCalledWith(
        companyId,
        fakeClient.id,
        payload,
      );
    });
  });

  describe('deleteById', () => {
    it('calls remove service method', async () => {
      mockClientService.remove.mockResolvedValue(undefined);

      await controller.deleteById(companyId, fakeClient.id);

      expect(mockClientService.remove).toHaveBeenCalledWith(companyId, fakeClient.id);
    });
  });
});
