// ABOUTME: REST controller for Sale entity with CRUD endpoints.
// ABOUTME: Provides endpoints for managing sales with multi-tenant isolation.

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
import { SaleService } from '../service/SaleService';
import { SaleDto } from '../dto/SaleDto';
import { CreateSalePayloadDto } from '../dto/CreateSalePayloadDto';
import { UpdateSalePayloadDto, UpdateSaleStatusDto } from '../dto/UpdateSalePayloadDto';
import { FilterSalesQueryDto } from '../dto/FilterSalesQueryDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { ApiPaginationResponse } from '../../shared/decorator/ApiPaginationResult';
import { JwtAuthGuard } from '../../shared/guard/JwtAuthGuard';
import { CompanyContextGuard } from '../../shared/guard/CompanyContextGuard';
import { PermissionsGuard } from '../../shared/guard/PermissionsGuard';
import { CompanyContext } from '../../shared/decorator/CompanyContext';
import { Permissions } from '../../shared/decorator/Permissions';
import { Permission } from '../../shared/enum/Permission';

@Controller('sales')
@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyContextGuard, PermissionsGuard)
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Get()
  @Version('1')
  @Permissions(Permission.SALES_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findAllSales',
    summary: 'Find all sales',
    description: 'Find all sales for the current company with pagination and filtering',
  })
  @ApiPaginationResponse(SaleDto)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @CompanyContext() companyId: string,
    @Query() query: FilterSalesQueryDto,
  ): Promise<PaginationResultDto<SaleDto>> {
    const response = await this.saleService.findAll(companyId, query);

    const pagination = new PaginationResultDto<SaleDto>();
    pagination.docs = response.docs.map((sale) => SaleDto.buildDto(sale));
    pagination.total = response.total;
    pagination.page = response.page;
    pagination.pages = response.pages;
    pagination.limit = response.limit;

    return pagination;
  }

  @Get(':id')
  @Version('1')
  @Permissions(Permission.SALES_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findSaleById',
    summary: 'Get a sale by ID',
    description: 'Get a sale by ID with line items for the current company',
  })
  @ApiOkResponse({
    description: 'Return a sale',
    type: SaleDto,
  })
  @ApiNotFoundResponse({ description: 'Sale not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SaleDto> {
    const sale = await this.saleService.findById(companyId, id);
    return SaleDto.buildDto(sale);
  }

  @Post()
  @Version('1')
  @Permissions(Permission.SALES_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createSale',
    summary: 'Create a new sale',
    description: 'Create a new sale with line items for the current company',
  })
  @ApiCreatedResponse({
    description: 'Sale created successfully',
    type: SaleDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @CompanyContext() companyId: string,
    @Body() payload: CreateSalePayloadDto,
  ): Promise<SaleDto> {
    const sale = await this.saleService.create(companyId, payload);
    return SaleDto.buildDto(sale);
  }

  @Patch(':id')
  @Version('1')
  @Permissions(Permission.SALES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'updateSaleById',
    summary: 'Update a sale by ID',
    description: 'Update a sale by ID for the current company',
  })
  @ApiOkResponse({
    description: 'Sale updated successfully',
    type: SaleDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Sale not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateSalePayloadDto,
  ): Promise<SaleDto> {
    const sale = await this.saleService.updateById(companyId, id, payload);
    return SaleDto.buildDto(sale);
  }

  @Patch(':id/status')
  @Version('1')
  @Permissions(Permission.SALES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'updateSaleStatus',
    summary: 'Update sale status',
    description: 'Update the status of a sale',
  })
  @ApiOkResponse({
    description: 'Sale status updated successfully',
    type: SaleDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Sale not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateStatus(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateSaleStatusDto,
  ): Promise<SaleDto> {
    const sale = await this.saleService.updateStatus(companyId, id, payload);
    return SaleDto.buildDto(sale);
  }

  @Delete(':id')
  @Version('1')
  @Permissions(Permission.SALES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'deleteSaleById',
    summary: 'Delete a sale by ID',
    description: 'Delete a sale by ID for the current company',
  })
  @ApiNoContentResponse({ description: 'Sale deleted successfully' })
  @ApiNotFoundResponse({ description: 'Sale not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deleteById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.saleService.remove(companyId, id);
  }
}
