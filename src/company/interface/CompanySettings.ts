// ABOUTME: Interface defining the structure of company settings stored as JSONB.
// ABOUTME: Contains configuration for currency, timezone, tax rates, prefixes, and inventory settings.

export type Currency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'MXN'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'CHF';

export type Plan = 'free' | 'basic' | 'premium';

export interface CompanySettings {
  currency: Currency;
  plan: Plan;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
  taxRate: number;
  invoicePrefix: string;
  purchaseOrderPrefix: string;
  allowNegativeInventory: boolean;
  lowStockThreshold: number;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  currency: 'USD',
  plan: 'free',
  timezone: 'America/New_York',
  dateFormat: 'YYYY-MM-DD',
  fiscalYearStart: '01-01',
  taxRate: 0,
  invoicePrefix: 'INV-',
  purchaseOrderPrefix: 'PO-',
  allowNegativeInventory: false,
  lowStockThreshold: 10,
};
