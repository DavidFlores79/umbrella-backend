// ABOUTME: REST controller for Product entity with CRUD endpoints.
// ABOUTME: Provides endpoints for managing products with multi-tenant isolation.

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
import { ProductService } from '../service/ProductService';
import { ProductDto } from '../dto/ProductDto';
import { CreateProductPayloadDto } from '../dto/CreateProductPayloadDto';
import { UpdateProductPayloadDto } from '../dto/UpdateProductPayloadDto';
import { FilterProductsQueryDto } from '../dto/FilterProductsQueryDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { ApiPaginationResponse } from '../../shared/decorator/ApiPaginationResult';
import { CompanyContext } from '../../shared/decorator/CompanyContext';

@Controller('products')
@ApiTags('Products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'findAllProducts',
    summary: 'Find all products',
    description:
      'Find all products for the current company with pagination and filtering',
  })
  @ApiPaginationResponse(ProductDto)
  async findAll(
    @CompanyContext() companyId: string,
    @Query() query: FilterProductsQueryDto,
  ): Promise<PaginationResultDto<ProductDto>> {
    const response = await this.productService.findAll(companyId, query);

    const pagination = new PaginationResultDto<ProductDto>();
    pagination.docs = response.docs.map((product) =>
      ProductDto.buildDto(product),
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
    operationId: 'findProductById',
    summary: 'Get a product by ID',
    description: 'Get a product by ID for the current company',
  })
  @ApiOkResponse({
    description: 'Return a product',
    type: ProductDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async getById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductDto> {
    const product = await this.productService.findById(companyId, id);
    return ProductDto.buildDto(product);
  }

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createProduct',
    summary: 'Create a new product',
    description: 'Create a new product for the current company',
  })
  @ApiCreatedResponse({
    description: 'Product created successfully',
    type: ProductDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({ description: 'Product with this SKU already exists' })
  async create(
    @CompanyContext() companyId: string,
    @Body() payload: CreateProductPayloadDto,
  ): Promise<ProductDto> {
    const product = await this.productService.create(companyId, payload);
    return ProductDto.buildDto(product);
  }

  @Patch(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'updateProductById',
    summary: 'Update a product by ID',
    description: 'Update a product by ID for the current company',
  })
  @ApiOkResponse({
    description: 'Product updated successfully',
    type: ProductDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiConflictResponse({ description: 'Product with this SKU already exists' })
  async updateById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateProductPayloadDto,
  ): Promise<ProductDto> {
    const product = await this.productService.updateById(
      companyId,
      id,
      payload,
    );
    return ProductDto.buildDto(product);
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'deleteProductById',
    summary: 'Delete a product by ID',
    description: 'Delete a product by ID for the current company',
  })
  @ApiNoContentResponse({ description: 'Product deleted successfully' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async deleteById(
    @CompanyContext() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.productService.remove(companyId, id);
  }
}
