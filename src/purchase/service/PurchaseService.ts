// ABOUTME: Service layer for Purchase entity handling CRUD operations.
// ABOUTME: Contains business logic for purchase management including line items and totals calculation.

import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, LessThanOrEqual, MoreThanOrEqual, DataSource } from 'typeorm';
import { Purchase } from '../entity/Purchase';
import { PurchaseLineItem } from '../entity/PurchaseLineItem';
import { CreatePurchasePayloadDto } from '../dto/CreatePurchasePayloadDto';
import { UpdatePurchasePayloadDto, UpdatePurchaseStatusDto } from '../dto/UpdatePurchasePayloadDto';
import { FilterPurchasesQueryDto } from '../dto/FilterPurchasesQueryDto';
import { PaginatedResult } from '../../shared/interface/Pagination';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { CompanyService } from '../../company/service/CompanyService';

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(PurchaseLineItem)
    private lineItemRepository: Repository<PurchaseLineItem>,
    private readonly dataSource: DataSource,
    private readonly companyService: CompanyService,
  ) {}

  async create(
    companyId: string,
    payload: CreatePurchasePayloadDto,
  ): Promise<Purchase> {
    this.logger.log(`Creating purchase for company: ${companyId}`);

    return this.dataSource.transaction(async (manager) => {
      const poNumber = await this.generatePoNumber(companyId, manager);

      const { lineItems: lineItemsData, ...purchaseData } = payload;

      const purchase = manager.create(Purchase, {
        ...purchaseData,
        companyId,
        poNumber,
        subtotal: 0,
        taxAmount: 0,
        total: 0,
      });

      const savedPurchase = await manager.save(purchase);

      const lineItems: PurchaseLineItem[] = [];
      for (const itemData of lineItemsData) {
        const lineItem = this.calculateLineItem(itemData);
        lineItem.purchaseId = savedPurchase.id;
        const savedItem = await manager.save(PurchaseLineItem, lineItem);
        lineItems.push(savedItem);
      }

      const totals = this.calculateTotals(lineItems, payload.discount || 0);
      savedPurchase.subtotal = totals.subtotal;
      savedPurchase.taxAmount = totals.taxAmount;
      savedPurchase.total = totals.total;
      savedPurchase.lineItems = lineItems;

      await manager.save(savedPurchase);

      this.logger.log(`Purchase created successfully with id: ${savedPurchase.id}`);
      return savedPurchase;
    });
  }

  async findAll(
    companyId: string,
    filterDto: FilterPurchasesQueryDto,
  ): Promise<PaginatedResult<Purchase>> {
    const { page = 1, limit = 10, ...filters } = filterDto;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(companyId, filters);

    const [items, totalItems] = await this.purchaseRepository.findAndCount({
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

  async findById(companyId: string, id: string): Promise<Purchase> {
    this.logger.debug(`Finding purchase by id: ${id} for company: ${companyId}`);
    const purchase = await this.purchaseRepository.findOne({
      where: { id, companyId },
      relations: ['lineItems'],
    });

    if (!purchase) {
      this.logger.warn(`Purchase not found with id: ${id}`);
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }

  async updateById(
    companyId: string,
    id: string,
    payload: UpdatePurchasePayloadDto,
  ): Promise<Purchase> {
    this.logger.log(`Updating purchase with id: ${id}`);
    const { updatedAt, lineItems: lineItemsData, ...restData } = payload;

    const purchase = await this.purchaseRepository.findOne({
      where: { id, companyId },
      relations: ['lineItems'],
    });

    if (!purchase) {
      this.logger.warn(`Purchase not found for update with id: ${id}`);
      throw new NotFoundException('Purchase not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const updateData: Record<string, any> = { ...restData };

      if (lineItemsData) {
        await manager.delete(PurchaseLineItem, { purchaseId: id });

        const lineItems: PurchaseLineItem[] = [];
        for (const itemData of lineItemsData) {
          const lineItem = this.calculateLineItem(itemData);
          lineItem.purchaseId = id;
          const savedItem = await manager.save(PurchaseLineItem, lineItem);
          lineItems.push(savedItem);
        }

        const totals = this.calculateTotals(lineItems, restData.discount ?? purchase.discount);
        updateData.subtotal = totals.subtotal;
        updateData.taxAmount = totals.taxAmount;
        updateData.total = totals.total;
        purchase.lineItems = lineItems;
      }

      const result = await manager
        .createQueryBuilder()
        .update(Purchase)
        .set(updateData)
        .where(
          'id = :id AND company_id = :companyId AND updated_at::timestamp(2) = :updatedAt::timestamp(2)',
          { id, companyId, updatedAt },
        )
        .returning('*')
        .execute();

      if (result.affected === 0) {
        this.logger.error(`Outdated version detected during update for purchase: ${id}`);
        throw new OutdatedEntityVersionError(
          'An old version of Purchase was detected during the update',
          'Purchase',
          '409',
        );
      }

      const updatedPurchase = await manager.findOne(Purchase, {
        where: { id },
        relations: ['lineItems'],
      });

      this.logger.log(`Purchase updated successfully with id: ${id}`);
      return updatedPurchase!;
    });
  }

  async updateStatus(
    companyId: string,
    id: string,
    payload: UpdatePurchaseStatusDto,
  ): Promise<Purchase> {
    this.logger.log(`Updating purchase status for id: ${id} to ${payload.status}`);

    const purchase = await this.findById(companyId, id);

    return this.dataSource.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .update(Purchase)
        .set({ status: payload.status })
        .where(
          'id = :id AND company_id = :companyId AND updated_at::timestamp(2) = :updatedAt::timestamp(2)',
          { id, companyId, updatedAt: payload.updatedAt },
        )
        .returning('*')
        .execute();

      if (result.affected === 0) {
        throw new OutdatedEntityVersionError(
          'An old version of Purchase was detected during the update',
          'Purchase',
          '409',
        );
      }

      return this.findById(companyId, id);
    });
  }

  async remove(companyId: string, id: string): Promise<void> {
    this.logger.log(`Deleting purchase with id: ${id}`);
    const result = await this.purchaseRepository.delete({ id, companyId });

    if (result.affected === 0) {
      throw new NotFoundException('Purchase not found');
    }

    this.logger.log(`Purchase deleted successfully with id: ${id}`);
  }

  private buildWhere(
    companyId: string,
    filters: Omit<FilterPurchasesQueryDto, 'page' | 'limit'>,
  ): Record<string, any> {
    const where: Record<string, any> = { companyId };

    if (filters.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.poNumber) {
      where.poNumber = ILike(`%${filters.poNumber}%`);
    }

    if (filters.orderDateFrom && filters.orderDateTo) {
      where.orderDate = Between(filters.orderDateFrom, filters.orderDateTo);
    } else if (filters.orderDateFrom) {
      where.orderDate = MoreThanOrEqual(filters.orderDateFrom);
    } else if (filters.orderDateTo) {
      where.orderDate = LessThanOrEqual(filters.orderDateTo);
    }

    return where;
  }

  private async generatePoNumber(
    companyId: string,
    manager: any,
  ): Promise<string> {
    const company = await this.companyService.findById(companyId);
    const prefix = company.settings?.purchaseOrderPrefix || 'PO-';
    const year = new Date().getFullYear();

    const lastPurchase = await manager.findOne(Purchase, {
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    let sequence = 1;
    if (lastPurchase) {
      const match = lastPurchase.poNumber.match(/(\d+)$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${year}-${sequence.toString().padStart(4, '0')}`;
  }

  private calculateLineItem(itemData: any): PurchaseLineItem {
    const lineItem = new PurchaseLineItem();
    lineItem.productId = itemData.productId || null;
    lineItem.description = itemData.description;
    lineItem.quantity = itemData.quantity;
    lineItem.unitCost = itemData.unitCost;
    lineItem.taxRate = itemData.taxRate || 0;
    lineItem.quantityReceived = 0;

    lineItem.subtotal = Number((lineItem.quantity * lineItem.unitCost).toFixed(2));
    lineItem.taxAmount = Number((lineItem.subtotal * lineItem.taxRate / 100).toFixed(2));
    lineItem.total = Number((lineItem.subtotal + lineItem.taxAmount).toFixed(2));

    return lineItem;
  }

  private calculateTotals(
    lineItems: PurchaseLineItem[],
    discount: number,
  ): { subtotal: number; taxAmount: number; total: number } {
    const subtotal = lineItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const taxAmount = lineItems.reduce((sum, item) => sum + Number(item.taxAmount), 0);
    const total = Number((subtotal + taxAmount - discount).toFixed(2));

    return { subtotal, taxAmount, total };
  }
}
