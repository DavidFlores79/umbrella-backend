// ABOUTME: REST controller for Vendor entity with CRUD endpoints.
// ABOUTME: Provides endpoints for managing vendors with multi-tenant isolation.

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
import { VendorService } from '../service/VendorService';
import { VendorDto } from '../dto/VendorDto';
import { CreateVendorPayloadDto } from '../dto/CreateVendorPayloadDto';
import { UpdateVendorPayloadDto } from '../dto/UpdateVendorPayloadDto';
import { FilterVendorsQueryDto } from '../dto/FilterVendorsQueryDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { ApiPaginationResponse } from '../../shared/decorator/ApiPaginationResult';
import { JwtAuthGuard } from '../../shared/guard/JwtAuthGuard';
import { CompanyContextGuard } from '../../shared/guard/CompanyContextGuard';
import { PermissionsGuard } from '../../shared/guard/PermissionsGuard';
import { CompanyContext } from '../../shared/decorator/CompanyContext';
import { Permissions } from '../../shared/decorator/Permissions';
import { Permission } from '../../shared/enum/Permission';

@Controller('vendors')
@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyContextGuard, PermissionsGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get()
  @Version('1')
  @Permissions(Permission.VENDORS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findAllVendors',
    summary: 'Find all vendors',
    description:
      'Find all vendors for the current company with pagination and filtering',
  })
  @ApiPaginationResponse(VendorDto)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @CompanyContext() companyId: string,
    @Query() query: FilterVendorsQueryDto,
  ): Promise<PaginationResultDto<VendorDto>> {
    const response = await this.vendorService.findAll(companyId, query);

    const pagination = new PaginationResultDto<VendorDto>();
    pagination.docs = response.docs.map((vendor) => VendorDto.buildDto(vendor));
    pagination.total = response.total;
    pagination.page = response.page;
    pagination.pages = response.pages;
    pagination.limit = response.limit;

    return pagination;
  }

  @Get(':id')
  @Version('1')
  @Permissions(Permission.VENDORS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findVendorById',
    summary: 'Get a vendor by ID',
    description: 'Get a vendor by ID for the current company',
  })
  @ApiOkResponse({
    description: 'Return a vendor',
    type: VendorDto,
  })
  @ApiNotFoundResponse({ description: 'Vendor not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VendorDto> {
    const vendor = await this.vendorService.findById(companyId, id);
    return VendorDto.buildDto(vendor);
  }

  @Post()
  @Version('1')
  @Permissions(Permission.VENDORS_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createVendor',
    summary: 'Create a new vendor',
    description: 'Create a new vendor for the current company',
  })
  @ApiCreatedResponse({
    description: 'Vendor created successfully',
    type: VendorDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({ description: 'Vendor with this email already exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @CompanyContext() companyId: string,
    @Body() payload: CreateVendorPayloadDto,
  ): Promise<VendorDto> {
    const vendor = await this.vendorService.create(companyId, payload);
    return VendorDto.buildDto(vendor);
  }

  @Patch(':id')
  @Version('1')
  @Permissions(Permission.VENDORS_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'updateVendorById',
    summary: 'Update a vendor by ID',
    description: 'Update a vendor by ID for the current company',
  })
  @ApiOkResponse({
    description: 'Vendor updated successfully',
    type: VendorDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Vendor not found' })
  @ApiConflictResponse({ description: 'Vendor with this email already exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateVendorPayloadDto,
  ): Promise<VendorDto> {
    const vendor = await this.vendorService.updateById(companyId, id, payload);
    return VendorDto.buildDto(vendor);
  }

  @Delete(':id')
  @Version('1')
  @Permissions(Permission.VENDORS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'deleteVendorById',
    summary: 'Delete a vendor by ID',
    description: 'Delete a vendor by ID for the current company',
  })
  @ApiNoContentResponse({ description: 'Vendor deleted successfully' })
  @ApiNotFoundResponse({ description: 'Vendor not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deleteById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.vendorService.remove(companyId, id);
  }
}
