// ABOUTME: REST controller for Client entity with CRUD endpoints.
// ABOUTME: Provides endpoints for managing clients with multi-tenant isolation.

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Version,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ClientService } from '../service/ClientService';
import { ClientDto } from '../dto/ClientDto';
import { CreateClientPayloadDto } from '../dto/CreateClientPayloadDto';
import { UpdateClientPayloadDto } from '../dto/UpdateClientPayloadDto';
import { FilterClientsQueryDto } from '../dto/FilterClientsQueryDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { ApiPaginationResponse } from '../../shared/decorator/ApiPaginationResult';
import { JwtAuthGuard } from '../../shared/guard/JwtAuthGuard';
import { CompanyContextGuard } from '../../shared/guard/CompanyContextGuard';
import { PermissionsGuard } from '../../shared/guard/PermissionsGuard';
import { CompanyContext } from '../../shared/decorator/CompanyContext';
import { Permissions } from '../../shared/decorator/Permissions';
import { Permission } from '../../shared/enum/Permission';

@Controller('clients')
@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyContextGuard, PermissionsGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @Version('1')
  @Permissions(Permission.CLIENTS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findAllClients',
    summary: 'Find all clients',
    description:
      'Find all clients for the current company with pagination and filtering',
  })
  @ApiPaginationResponse(ClientDto)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @CompanyContext() companyId: string,
    @Query() query: FilterClientsQueryDto,
  ): Promise<PaginationResultDto<ClientDto>> {
    const response = await this.clientService.findAll(companyId, query);

    const pagination = new PaginationResultDto<ClientDto>();
    pagination.docs = response.docs.map((client) => ClientDto.buildDto(client));
    pagination.total = response.total;
    pagination.page = response.page;
    pagination.pages = response.pages;
    pagination.limit = response.limit;

    return pagination;
  }

  @Get(':id')
  @Version('1')
  @Permissions(Permission.CLIENTS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findClientById',
    summary: 'Get a client by ID',
    description: 'Get a client by ID for the current company',
  })
  @ApiOkResponse({
    description: 'Return a client',
    type: ClientDto,
  })
  @ApiNotFoundResponse({ description: 'Client not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClientDto> {
    const client = await this.clientService.findById(companyId, id);
    return ClientDto.buildDto(client);
  }

  @Post()
  @Version('1')
  @Permissions(Permission.CLIENTS_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createClient',
    summary: 'Create a new client',
    description: 'Create a new client for the current company',
  })
  @ApiCreatedResponse({
    description: 'Client created successfully',
    type: ClientDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({ description: 'Client with this email already exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @CompanyContext() companyId: string,
    @Body() payload: CreateClientPayloadDto,
  ): Promise<ClientDto> {
    const client = await this.clientService.create(companyId, payload);
    return ClientDto.buildDto(client);
  }

  @Patch(':id')
  @Version('1')
  @Permissions(Permission.CLIENTS_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'updateClientById',
    summary: 'Update a client by ID',
    description: 'Update a client by ID for the current company',
  })
  @ApiOkResponse({
    description: 'Client updated successfully',
    type: ClientDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  @ApiConflictResponse({ description: 'Client with this email already exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateClientPayloadDto,
  ): Promise<ClientDto> {
    const client = await this.clientService.updateById(companyId, id, payload);
    return ClientDto.buildDto(client);
  }

  @Delete(':id')
  @Version('1')
  @Permissions(Permission.CLIENTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'deleteClientById',
    summary: 'Delete a client by ID',
    description: 'Delete a client by ID for the current company',
  })
  @ApiNoContentResponse({ description: 'Client deleted successfully' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deleteById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.clientService.remove(companyId, id);
  }
}
