// ABOUTME: REST controller for Purchase entity with CRUD endpoints.
// ABOUTME: Provides endpoints for managing purchase orders with multi-tenant isolation.

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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PurchaseService } from '../service/PurchaseService';
import { PurchaseDto } from '../dto/PurchaseDto';
import { CreatePurchasePayloadDto } from '../dto/CreatePurchasePayloadDto';
import {
  UpdatePurchasePayloadDto,
  UpdatePurchaseStatusDto,
} from '../dto/UpdatePurchasePayloadDto';
import { FilterPurchasesQueryDto } from '../dto/FilterPurchasesQueryDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { ApiPaginationResponse } from '../../shared/decorator/ApiPaginationResult';
import { JwtAuthGuard } from '../../shared/guard/JwtAuthGuard';
import { CompanyContextGuard } from '../../shared/guard/CompanyContextGuard';
import { PermissionsGuard } from '../../shared/guard/PermissionsGuard';
import { CompanyContext } from '../../shared/decorator/CompanyContext';
import { Permissions } from '../../shared/decorator/Permissions';
import { Permission } from '../../shared/enum/Permission';

@Controller('purchases')
@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyContextGuard, PermissionsGuard)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  @Version('1')
  @Permissions(Permission.PURCHASES_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findAllPurchases',
    summary: 'Find all purchases',
    description:
      'Find all purchases for the current company with pagination and filtering',
  })
  @ApiPaginationResponse(PurchaseDto)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @CompanyContext() companyId: string,
    @Query() query: FilterPurchasesQueryDto,
  ): Promise<PaginationResultDto<PurchaseDto>> {
    const response = await this.purchaseService.findAll(companyId, query);

    const pagination = new PaginationResultDto<PurchaseDto>();
    pagination.docs = response.docs.map((purchase) =>
      PurchaseDto.buildDto(purchase),
    );
    pagination.total = response.total;
    pagination.page = response.page;
    pagination.pages = response.pages;
    pagination.limit = response.limit;

    return pagination;
  }

  @Get(':id')
  @Version('1')
  @Permissions(Permission.PURCHASES_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findPurchaseById',
    summary: 'Get a purchase by ID',
    description: 'Get a purchase by ID with line items for the current company',
  })
  @ApiOkResponse({
    description: 'Return a purchase',
    type: PurchaseDto,
  })
  @ApiNotFoundResponse({ description: 'Purchase not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PurchaseDto> {
    const purchase = await this.purchaseService.findById(companyId, id);
    return PurchaseDto.buildDto(purchase);
  }

  @Post()
  @Version('1')
  @Permissions(Permission.PURCHASES_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createPurchase',
    summary: 'Create a new purchase',
    description:
      'Create a new purchase with line items for the current company',
  })
  @ApiCreatedResponse({
    description: 'Purchase created successfully',
    type: PurchaseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @CompanyContext() companyId: string,
    @Body() payload: CreatePurchasePayloadDto,
  ): Promise<PurchaseDto> {
    const purchase = await this.purchaseService.create(companyId, payload);
    return PurchaseDto.buildDto(purchase);
  }

  @Patch(':id')
  @Version('1')
  @Permissions(Permission.PURCHASES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'updatePurchaseById',
    summary: 'Update a purchase by ID',
    description: 'Update a purchase by ID for the current company',
  })
  @ApiOkResponse({
    description: 'Purchase updated successfully',
    type: PurchaseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Purchase not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdatePurchasePayloadDto,
  ): Promise<PurchaseDto> {
    const purchase = await this.purchaseService.updateById(
      companyId,
      id,
      payload,
    );
    return PurchaseDto.buildDto(purchase);
  }

  @Patch(':id/status')
  @Version('1')
  @Permissions(Permission.PURCHASES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'updatePurchaseStatus',
    summary: 'Update purchase status',
    description: 'Update the status of a purchase',
  })
  @ApiOkResponse({
    description: 'Purchase status updated successfully',
    type: PurchaseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Purchase not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateStatus(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdatePurchaseStatusDto,
  ): Promise<PurchaseDto> {
    const purchase = await this.purchaseService.updateStatus(
      companyId,
      id,
      payload,
    );
    return PurchaseDto.buildDto(purchase);
  }

  @Delete(':id')
  @Version('1')
  @Permissions(Permission.PURCHASES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'deletePurchaseById',
    summary: 'Delete a purchase by ID',
    description: 'Delete a purchase by ID for the current company',
  })
  @ApiNoContentResponse({ description: 'Purchase deleted successfully' })
  @ApiNotFoundResponse({ description: 'Purchase not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deleteById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.purchaseService.remove(companyId, id);
  }
}
