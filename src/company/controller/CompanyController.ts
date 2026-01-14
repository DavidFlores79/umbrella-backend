// ABOUTME: REST controller for Company entity with CRUD endpoints.
// ABOUTME: Provides endpoints for managing companies with proper validation and documentation.

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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CompanyService } from '../service/CompanyService';
import { CompanyDto } from '../dto/CompanyDto';
import { CreateCompanyPayloadDto } from '../dto/CreateCompanyPayloadDto';
import { UpdateCompanyPayloadDto } from '../dto/UpdateCompanyPayloadDto';
import { FilterCompaniesQueryDto } from '../dto/FilterCompaniesQueryDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { ApiPaginationResponse } from '../../shared/decorator/ApiPaginationResult';

@Controller('companies')
@ApiTags('Companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findAllCompanies',
    summary: 'Find all companies',
    description:
      'Find all companies with pagination and filtering (admin only)',
  })
  @ApiPaginationResponse(CompanyDto)
  async findAll(
    @Query() query: FilterCompaniesQueryDto,
  ): Promise<PaginationResultDto<CompanyDto>> {
    const response = await this.companyService.findAll(query);

    const pagination = new PaginationResultDto<CompanyDto>();
    pagination.docs = response.docs.map((company) =>
      CompanyDto.buildDto(company),
    );
    pagination.total = response.total;
    pagination.page = response.page;
    pagination.pages = response.pages;
    pagination.limit = response.limit;

    return pagination;
  }

  @Get(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findCompanyById',
    summary: 'Get a company by ID',
    description: 'Get a company by ID',
  })
  @ApiOkResponse({
    description: 'Return a company',
    type: CompanyDto,
  })
  @ApiNotFoundResponse({ description: 'Company not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<CompanyDto> {
    const company = await this.companyService.findById(id);
    return CompanyDto.buildDto(company);
  }

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createCompany',
    summary: 'Create a new company',
    description: 'Create a new company (admin only)',
  })
  @ApiCreatedResponse({
    description: 'Company created successfully',
    type: CompanyDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({
    description: 'Company with this email already exists',
  })
  async create(@Body() payload: CreateCompanyPayloadDto): Promise<CompanyDto> {
    const company = await this.companyService.create(payload);
    return CompanyDto.buildDto(company);
  }

  @Patch(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'updateCompanyById',
    summary: 'Update a company by ID',
    description: 'Update a company by ID',
  })
  @ApiOkResponse({
    description: 'Company updated successfully',
    type: CompanyDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Company not found' })
  @ApiConflictResponse({
    description: 'Company with this email already exists',
  })
  async updateById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateCompanyPayloadDto,
  ): Promise<CompanyDto> {
    const company = await this.companyService.updateById(id, payload);
    return CompanyDto.buildDto(company);
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'deleteCompanyById',
    summary: 'Delete a company by ID',
    description: 'Delete a company by ID (admin only)',
  })
  @ApiNoContentResponse({ description: 'Company deleted successfully' })
  @ApiNotFoundResponse({ description: 'Company not found' })
  async deleteById(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.companyService.remove(id);
  }
}
