// ABOUTME: Service layer for Sale entity handling CRUD operations.
// ABOUTME: Contains business logic for sale management including line items and totals calculation.

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  ILike,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  DataSource,
  EntityManager,
} from 'typeorm';
import { Sale } from '../entity/Sale';
import { SaleLineItem } from '../entity/SaleLineItem';
import { CreateSalePayloadDto } from '../dto/CreateSalePayloadDto';
import {
  UpdateSalePayloadDto,
  UpdateSaleStatusDto,
} from '../dto/UpdateSalePayloadDto';
import { FilterSalesQueryDto } from '../dto/FilterSalesQueryDto';
import { PaginatedResult } from '../../shared/interface/Pagination';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { CompanyService } from '../../company/service/CompanyService';

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);

  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleLineItem)
    private lineItemRepository: Repository<SaleLineItem>,
    private readonly dataSource: DataSource,
    private readonly companyService: CompanyService,
  ) {}

  async create(
    companyId: string,
    payload: CreateSalePayloadDto,
  ): Promise<Sale> {
    this.logger.log(`Creating sale for company: ${companyId}`);

    return this.dataSource.transaction(async (manager) => {
      const invoiceNumber = await this.generateInvoiceNumber(
        companyId,
        manager,
      );

      const { lineItems: lineItemsData, ...saleData } = payload;

      const sale = manager.create(Sale, {
        ...saleData,
        companyId,
        invoiceNumber,
        subtotal: 0,
        taxAmount: 0,
        total: 0,
      });

      const savedSale = await manager.save(sale);

      const lineItems: SaleLineItem[] = [];
      for (const itemData of lineItemsData) {
        const lineItem = this.calculateLineItem(itemData);
        lineItem.saleId = savedSale.id;
        const savedItem = await manager.save(SaleLineItem, lineItem);
        lineItems.push(savedItem);
      }

      const totals = this.calculateTotals(lineItems, payload.discount || 0);
      savedSale.subtotal = totals.subtotal;
      savedSale.taxAmount = totals.taxAmount;
      savedSale.total = totals.total;
      savedSale.lineItems = lineItems;

      await manager.save(savedSale);

      this.logger.log(`Sale created successfully with id: ${savedSale.id}`);
      return savedSale;
    });
  }

  async findAll(
    companyId: string,
    filterDto: FilterSalesQueryDto,
  ): Promise<PaginatedResult<Sale>> {
    const { page = 1, limit = 10, ...filters } = filterDto;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(companyId, filters);

    const [items, totalItems] = await this.saleRepository.findAndCount({
      where,
      relations: ['lineItems'],
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

  async findById(companyId: string, id: string): Promise<Sale> {
    this.logger.debug(`Finding sale by id: ${id} for company: ${companyId}`);
    const sale = await this.saleRepository.findOne({
      where: { id, companyId },
      relations: ['lineItems'],
    });

    if (!sale) {
      this.logger.warn(`Sale not found with id: ${id}`);
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async updateById(
    companyId: string,
    id: string,
    payload: UpdateSalePayloadDto,
  ): Promise<Sale> {
    this.logger.log(`Updating sale with id: ${id}`);
    const { updatedAt, lineItems: lineItemsData, ...restData } = payload;

    const sale = await this.saleRepository.findOne({
      where: { id, companyId },
      relations: ['lineItems'],
    });

    if (!sale) {
      this.logger.warn(`Sale not found for update with id: ${id}`);
      throw new NotFoundException('Sale not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const updateData: Record<string, any> = { ...restData };

      if (lineItemsData) {
        await manager.delete(SaleLineItem, { saleId: id });

        const lineItems: SaleLineItem[] = [];
        for (const itemData of lineItemsData) {
          const lineItem = this.calculateLineItem(itemData);
          lineItem.saleId = id;
          const savedItem = await manager.save(SaleLineItem, lineItem);
          lineItems.push(savedItem);
        }

        const totals = this.calculateTotals(
          lineItems,
          restData.discount ?? sale.discount,
        );
        updateData.subtotal = totals.subtotal;
        updateData.taxAmount = totals.taxAmount;
        updateData.total = totals.total;
        sale.lineItems = lineItems;
      }

      const result = await manager
        .createQueryBuilder()
        .update(Sale)
        .set(updateData)
        .where(
          'id = :id AND company_id = :companyId AND updated_at::timestamp(2) = :updatedAt::timestamp(2)',
          { id, companyId, updatedAt },
        )
        .returning('*')
        .execute();

      if (result.affected === 0) {
        this.logger.error(
          `Outdated version detected during update for sale: ${id}`,
        );
        throw new OutdatedEntityVersionError(
          'An old version of Sale was detected during the update',
          'Sale',
          '409',
        );
      }

      const updatedSale = await manager.findOne(Sale, {
        where: { id },
        relations: ['lineItems'],
      });

      this.logger.log(`Sale updated successfully with id: ${id}`);
      return updatedSale!;
    });
  }

  async updateStatus(
    companyId: string,
    id: string,
    payload: UpdateSaleStatusDto,
  ): Promise<Sale> {
    this.logger.log(`Updating sale status for id: ${id} to ${payload.status}`);

    await this.findById(companyId, id);

    return this.dataSource.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .update(Sale)
        .set({ status: payload.status })
        .where(
          'id = :id AND company_id = :companyId AND updated_at::timestamp(2) = :updatedAt::timestamp(2)',
          { id, companyId, updatedAt: payload.updatedAt },
        )
        .returning('*')
        .execute();

      if (result.affected === 0) {
        throw new OutdatedEntityVersionError(
          'An old version of Sale was detected during the update',
          'Sale',
          '409',
        );
      }

      return this.findById(companyId, id);
    });
  }

  async remove(companyId: string, id: string): Promise<void> {
    this.logger.log(`Deleting sale with id: ${id}`);
    const result = await this.saleRepository.delete({ id, companyId });

    if (result.affected === 0) {
      throw new NotFoundException('Sale not found');
    }

    this.logger.log(`Sale deleted successfully with id: ${id}`);
  }

  private buildWhere(
    companyId: string,
    filters: Omit<FilterSalesQueryDto, 'page' | 'limit'>,
  ): Record<string, any> {
    const where: Record<string, any> = { companyId };

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.invoiceNumber) {
      where.invoiceNumber = ILike(`%${filters.invoiceNumber}%`);
    }

    if (filters.saleDateFrom && filters.saleDateTo) {
      where.saleDate = Between(filters.saleDateFrom, filters.saleDateTo);
    } else if (filters.saleDateFrom) {
      where.saleDate = MoreThanOrEqual(filters.saleDateFrom);
    } else if (filters.saleDateTo) {
      where.saleDate = LessThanOrEqual(filters.saleDateTo);
    }

    return where;
  }

  private async generateInvoiceNumber(
    companyId: string,
    manager: EntityManager,
  ): Promise<string> {
    const company = await this.companyService.findById(companyId);
    const prefix = company.settings?.invoicePrefix || 'INV-';
    const year = new Date().getFullYear();

    const lastSale = await manager.findOne(Sale, {
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    let sequence = 1;
    if (lastSale) {
      const match = lastSale.invoiceNumber.match(/(\d+)$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${year}-${sequence.toString().padStart(4, '0')}`;
  }

  private calculateLineItem(itemData: {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }): SaleLineItem {
    const lineItem = new SaleLineItem();
    lineItem.productId = itemData.productId || null;
    lineItem.description = itemData.description;
    lineItem.quantity = itemData.quantity;
    lineItem.unitPrice = itemData.unitPrice;
    lineItem.taxRate = itemData.taxRate || 0;

    lineItem.subtotal = Number(
      (lineItem.quantity * lineItem.unitPrice).toFixed(2),
    );
    lineItem.taxAmount = Number(
      ((lineItem.subtotal * lineItem.taxRate) / 100).toFixed(2),
    );
    lineItem.total = Number(
      (lineItem.subtotal + lineItem.taxAmount).toFixed(2),
    );

    return lineItem;
  }

  private calculateTotals(
    lineItems: SaleLineItem[],
    discount: number,
  ): { subtotal: number; taxAmount: number; total: number } {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );
    const taxAmount = lineItems.reduce(
      (sum, item) => sum + Number(item.taxAmount),
      0,
    );
    const total = Number((subtotal + taxAmount - discount).toFixed(2));

    return { subtotal, taxAmount, total };
  }
}
