// ABOUTME: Database migration for umbrella backend multi-tenant entities.
// ABOUTME: Creates Company, Product, Client, Vendor, Sale, Purchase tables with line items and user enhancements.

import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1767218429047 implements MigrationInterface {
    name = 'Migration1767218429047'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(50), "address" character varying(500), "city" character varying(100), "state" character varying(100), "country" character varying(100), "postal_code" character varying(20), "tax_id" character varying(50), "website" character varying(500), "logo" character varying(500), "settings" jsonb NOT NULL DEFAULT '{"currency":"USD","plan":"free","timezone":"America/New_York","dateFormat":"YYYY-MM-DD","fiscalYearStart":"01-01","taxRate":0,"invoicePrefix":"INV-","purchaseOrderPrefix":"PO-","allowNegativeInventory":false,"lowStockThreshold":10}'::jsonb, "status" character varying(20) NOT NULL DEFAULT 'active', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_d0af6f5866201d5cb424767744a" UNIQUE ("email"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_company_name" ON "companies" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_company_email" ON "companies" ("email") `);
        await queryRunner.query(`CREATE INDEX "idx_company_status" ON "companies" ("status") `);
        await queryRunner.query(`CREATE TABLE "vendors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255), "phone" character varying(50), "address" character varying(500), "city" character varying(100), "state" character varying(100), "country" character varying(100), "postal_code" character varying(20), "tax_id" character varying(50), "contact_name" character varying(255), "notes" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9c956c9797edfae5c6ddacc4e6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_vendor_company_id" ON "vendors" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "idx_vendor_name" ON "vendors" ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_vendor_tax_id" ON "vendors" ("tax_id") `);
        await queryRunner.query(`CREATE INDEX "idx_vendor_is_active" ON "vendors" ("is_active") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_vendor_company_email" ON "vendors" ("company_id", "email") WHERE "email" IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255), "phone" character varying(50), "address" character varying(500), "city" character varying(100), "state" character varying(100), "country" character varying(100), "postal_code" character varying(20), "tax_id" character varying(50), "notes" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_client_company_id" ON "clients" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "idx_client_name" ON "clients" ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_client_tax_id" ON "clients" ("tax_id") `);
        await queryRunner.query(`CREATE INDEX "idx_client_is_active" ON "clients" ("is_active") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_client_company_email" ON "clients" ("company_id", "email") WHERE "email" IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "client_id" uuid, "invoice_number" character varying(50) NOT NULL, "sale_date" date NOT NULL, "due_date" date, "status" character varying(20) NOT NULL DEFAULT 'draft', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "tax_amount" numeric(12,2) NOT NULL DEFAULT '0', "discount" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_sale_company_id" ON "sales" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "idx_sale_client_id" ON "sales" ("client_id") `);
        await queryRunner.query(`CREATE INDEX "idx_sale_invoice_number" ON "sales" ("invoice_number") `);
        await queryRunner.query(`CREATE INDEX "idx_sale_date" ON "sales" ("sale_date") `);
        await queryRunner.query(`CREATE INDEX "idx_sale_status" ON "sales" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_sale_company_invoice" ON "sales" ("company_id", "invoice_number") `);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "sku" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "type" character varying(50) NOT NULL DEFAULT 'product', "category" character varying(50) NOT NULL DEFAULT 'other', "price" numeric(12,2) NOT NULL DEFAULT '0', "cost" numeric(12,2) NOT NULL DEFAULT '0', "tax_rate" numeric(5,2) NOT NULL DEFAULT '0', "unit" character varying(20), "track_inventory" boolean NOT NULL DEFAULT false, "min_stock" integer NOT NULL DEFAULT '0', "max_stock" integer, "image" character varying(500), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_product_company_id" ON "products" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "idx_product_sku" ON "products" ("sku") `);
        await queryRunner.query(`CREATE INDEX "idx_product_name" ON "products" ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_product_type" ON "products" ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_product_category" ON "products" ("category") `);
        await queryRunner.query(`CREATE INDEX "idx_product_is_active" ON "products" ("is_active") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_product_company_sku" ON "products" ("company_id", "sku") `);
        await queryRunner.query(`CREATE TABLE "sale_line_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sale_id" uuid NOT NULL, "product_id" uuid, "description" character varying(255) NOT NULL, "quantity" numeric(12,4) NOT NULL DEFAULT '1', "unit_price" numeric(12,2) NOT NULL DEFAULT '0', "tax_rate" numeric(5,2) NOT NULL DEFAULT '0', "tax_amount" numeric(12,2) NOT NULL DEFAULT '0', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_15be3b24517b9a2e2187ed23c94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_sale_line_item_sale_id" ON "sale_line_items" ("sale_id") `);
        await queryRunner.query(`CREATE INDEX "idx_sale_line_item_product_id" ON "sale_line_items" ("product_id") `);
        await queryRunner.query(`CREATE TABLE "purchases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "vendor_id" uuid, "po_number" character varying(50) NOT NULL, "order_date" date NOT NULL, "expected_date" date, "received_date" date, "status" character varying(20) NOT NULL DEFAULT 'draft', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "tax_amount" numeric(12,2) NOT NULL DEFAULT '0', "discount" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1d55032f37a34c6eceacbbca6b8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_purchase_company_id" ON "purchases" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "idx_purchase_vendor_id" ON "purchases" ("vendor_id") `);
        await queryRunner.query(`CREATE INDEX "idx_purchase_po_number" ON "purchases" ("po_number") `);
        await queryRunner.query(`CREATE INDEX "idx_purchase_order_date" ON "purchases" ("order_date") `);
        await queryRunner.query(`CREATE INDEX "idx_purchase_status" ON "purchases" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_purchase_company_po" ON "purchases" ("company_id", "po_number") `);
        await queryRunner.query(`CREATE TABLE "purchase_line_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "purchase_id" uuid NOT NULL, "product_id" uuid, "description" character varying(255) NOT NULL, "quantity" numeric(12,4) NOT NULL DEFAULT '1', "unit_cost" numeric(12,2) NOT NULL DEFAULT '0', "tax_rate" numeric(5,2) NOT NULL DEFAULT '0', "tax_amount" numeric(12,2) NOT NULL DEFAULT '0', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "quantity_received" numeric(12,4) NOT NULL DEFAULT '0', CONSTRAINT "PK_4605eaedb9e32cff205e7ae5ec3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_purchase_line_item_purchase_id" ON "purchase_line_items" ("purchase_id") `);
        await queryRunner.query(`CREATE INDEX "idx_purchase_line_item_product_id" ON "purchase_line_items" ("product_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "company_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying(20) NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_login" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "idx_user_company_id" ON "users" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "idx_user_role" ON "users" ("role") `);
        await queryRunner.query(`ALTER TABLE "vendors" ADD CONSTRAINT "FK_417f012e92f382001c77b953c57" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_fcadfe25d85cf21251273169128" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_6126ce1093dd7ed2d023c47633c" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_c49d95226945ca3a93584f912ca" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_b417f1726f6ccafb18730adffb0" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_line_items" ADD CONSTRAINT "FK_dae75d3339ca2915ec04a55b459" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_line_items" ADD CONSTRAINT "FK_d63e2808c2186b3c762b0bb5267" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_c594d713693899d85f454ccdebe" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_b9a9f16702bc091db7eb5e0d9c7" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_line_items" ADD CONSTRAINT "FK_e3765c149299492f8da7b33cb40" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_line_items" ADD CONSTRAINT "FK_7eb1def62db5a4664d2bd7784b7" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_line_items" DROP CONSTRAINT "FK_7eb1def62db5a4664d2bd7784b7"`);
        await queryRunner.query(`ALTER TABLE "purchase_line_items" DROP CONSTRAINT "FK_e3765c149299492f8da7b33cb40"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_b9a9f16702bc091db7eb5e0d9c7"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_c594d713693899d85f454ccdebe"`);
        await queryRunner.query(`ALTER TABLE "sale_line_items" DROP CONSTRAINT "FK_d63e2808c2186b3c762b0bb5267"`);
        await queryRunner.query(`ALTER TABLE "sale_line_items" DROP CONSTRAINT "FK_dae75d3339ca2915ec04a55b459"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_b417f1726f6ccafb18730adffb0"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_c49d95226945ca3a93584f912ca"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_6126ce1093dd7ed2d023c47633c"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_fcadfe25d85cf21251273169128"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_7ae6334059289559722437bcc1c"`);
        await queryRunner.query(`ALTER TABLE "vendors" DROP CONSTRAINT "FK_417f012e92f382001c77b953c57"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_role"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_company_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "permissions"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_purchase_line_item_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_purchase_line_item_purchase_id"`);
        await queryRunner.query(`DROP TABLE "purchase_line_items"`);
        await queryRunner.query(`DROP INDEX "public"."idx_purchase_company_po"`);
        await queryRunner.query(`DROP INDEX "public"."idx_purchase_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_purchase_order_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_purchase_po_number"`);
        await queryRunner.query(`DROP INDEX "public"."idx_purchase_vendor_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_purchase_company_id"`);
        await queryRunner.query(`DROP TABLE "purchases"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sale_line_item_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sale_line_item_sale_id"`);
        await queryRunner.query(`DROP TABLE "sale_line_items"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_company_sku"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_category"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_sku"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_company_id"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sale_company_invoice"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sale_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sale_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sale_invoice_number"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sale_client_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sale_company_id"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP INDEX "public"."idx_client_company_email"`);
        await queryRunner.query(`DROP INDEX "public"."idx_client_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_client_tax_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_client_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_client_company_id"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP INDEX "public"."idx_vendor_company_email"`);
        await queryRunner.query(`DROP INDEX "public"."idx_vendor_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_vendor_tax_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_vendor_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_vendor_company_id"`);
        await queryRunner.query(`DROP TABLE "vendors"`);
        await queryRunner.query(`DROP INDEX "public"."idx_company_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_company_email"`);
        await queryRunner.query(`DROP INDEX "public"."idx_company_name"`);
        await queryRunner.query(`DROP TABLE "companies"`);
    }

}
