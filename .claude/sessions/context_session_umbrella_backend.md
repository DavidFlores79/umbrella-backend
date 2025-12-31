# Umbrella Backend Development Plan

## Session Information
- **Feature**: umbrella-backend
- **Created**: 2025-12-31
- **Status**: Implementation Complete (Core Modules)
- **Target Repository**: `/Users/LAPTOP-david-001/Development/apps/Nest/umbrella-backend`
- **Branch**: `feat/umbrella-backend-api`

---

## Implementation Progress (2025-12-31)

### Completed Modules

| Module | Status | Notes |
|--------|--------|-------|
| **Shared Infrastructure** | ✅ Complete | Decorators (CompanyContext, Permissions, Roles, CurrentUser), Guards (JwtAuth, CompanyContext, Roles, Permissions), Enums (Role, Permission) |
| **Company** | ✅ Complete | Entity, DTOs, Service, Controller with full CRUD |
| **User Enhancements** | ✅ Complete | Added companyId, role, permissions, avatar, lastLogin to User entity |
| **Product** | ✅ Complete | Entity with SKU, pricing, category, inventory tracking |
| **Client** | ✅ Complete | Entity with company isolation, contact info |
| **Vendor** | ✅ Complete | Entity with company isolation, contact name |
| **Sale** | ✅ Complete | Sale + SaleLineItem entities, invoice generation, status workflow |
| **Purchase** | ✅ Complete | Purchase + PurchaseLineItem entities, PO generation, status workflow |
| **Database Migration** | ✅ Complete | Migration generated: 1767218429047 |

### Deferred to Future PRs

| Module | Status | Notes |
|--------|--------|-------|
| **Inventory** | ⏸ Deferred | InventoryItem, InventoryMovement, InventoryAlert |
| **FileUpload** | ⏸ Deferred | S3 integration for photos |
| **Installation** | ⏸ Deferred | Installation, InstallationEvent, InstallationPhoto |

### Key Technical Decisions

1. **Multi-tenancy**: Column-based isolation using `companyId`
2. **Line Items**: Separate tables (not JSON) for query performance
3. **JWT Payload**: Includes companyId, role, permissions
4. **Optimistic Locking**: Using `updatedAt` timestamp comparison
5. **Invoice/PO Generation**: Company-specific prefixes with year and sequence

### Files Created

```
src/
├── shared/
│   ├── decorator/
│   │   ├── CompanyContext.ts
│   │   ├── Permissions.ts
│   │   ├── Roles.ts
│   │   └── CurrentUser.ts
│   ├── guard/
│   │   ├── JwtAuthGuard.ts
│   │   ├── CompanyContextGuard.ts
│   │   ├── RolesGuard.ts
│   │   └── PermissionsGuard.ts
│   └── enum/
│       ├── Role.ts
│       └── Permission.ts
├── company/
│   ├── entity/Company.ts
│   ├── interface/CompanySettings.ts
│   ├── dto/*.ts
│   ├── service/CompanyService.ts
│   ├── controller/CompanyController.ts
│   └── CompanyModule.ts
├── product/
│   ├── entity/Product.ts
│   ├── enum/ProductType.ts
│   ├── dto/*.ts
│   ├── service/ProductService.ts
│   ├── controller/ProductController.ts
│   └── ProductModule.ts
├── client/
│   └── (same structure)
├── vendor/
│   └── (same structure)
├── sale/
│   ├── entity/Sale.ts
│   ├── entity/SaleLineItem.ts
│   ├── enum/SaleStatus.ts
│   └── (same structure)
├── purchase/
│   ├── entity/Purchase.ts
│   ├── entity/PurchaseLineItem.ts
│   ├── enum/PurchaseStatus.ts
│   └── (same structure)
└── database/migrations/
    └── 1767218429047-migration.ts
```

---

## 1. Project Overview

### Frontend Analysis (Angular umbrella-frontend)

The Angular frontend implements a multi-company income and expense management system with the following entities and operations:

#### Core Entities (from `src/app/shared/models/`)

| Entity | Description | Key Features |
|--------|-------------|--------------|
| **Company** | Multi-tenant organization | Settings (currency, plan, timezone), tax configuration, invoice prefixes |
| **User** | Users with RBAC | Roles (admin, manager, user), granular permissions, company association |
| **Product** | Products/services catalog | SKU, category, type (product/service/labor), pricing, tax rate, inventory tracking |
| **Client** | Customers for sales | Company-specific, contact info, tax ID |
| **Vendor** | Suppliers for purchases | Company-specific, contact info |
| **Sale** | Sales transactions | Invoice number, line items, status workflow (draft→pending→paid→cancelled) |
| **Purchase** | Purchase orders | PO number, line items, status workflow (draft→ordered→received→paid→cancelled) |
| **InventoryItem** | Stock levels | Product association, min/max thresholds, location |
| **InventoryMovement** | Stock changes | Type (in/out/adjustment), reference to sale/purchase |
| **Installation** | Field projects | Events with photos, team assignment, scheduling, status tracking |

#### Permission System

```typescript
Permissions:
- companies:read/write/delete
- users:read/write/delete
- products:read/write/delete
- clients:read/write/delete
- vendors:read/write/delete
- sales:read/write/delete
- purchases:read/write/delete
- inventory:read/write/delete
- reports:read/export
- dashboard:read
```

#### API Operations (from MockApiService)

| Module | Operations |
|--------|------------|
| Companies | getCompanies, getCompany, createCompany, updateCompany, deleteCompany |
| Users | getUsers(companyId?), getUser, createUser, updateUser, deleteUser |
| Auth | login, register |
| Products | getProducts(companyId?), getProduct, createProduct, updateProduct, deleteProduct |
| Clients | getClients(companyId?), getClient, createClient, updateClient, deleteClient |
| Vendors | getVendors(companyId?), getVendor, createVendor, updateVendor, deleteVendor |
| Sales | getSales(companyId?), getSale, createSale, updateSale, deleteSale |
| Purchases | getPurchases(companyId?), getPurchase, createPurchase, updatePurchase, deletePurchase |
| Inventory | getInventory(companyId?), getInventoryItem, createInventoryItem, updateInventoryItem, createMovement, getMovements, getAlerts |
| Installations | getInstallations(companyId?), getInstallation, createInstallation, updateInstallation, addEvent, deleteInstallation |

---

## 2. NestJS Base Project Analysis

### Existing Structure

```
src/
├── AppModule.ts              # Root module with Sentry, Config, Database
├── main.ts                   # Bootstrap with Swagger setup
├── config/
│   ├── EnvironmentVariables.ts
│   └── typeOrmConfig.ts
├── core/                     # Health checks, core services
├── database/
│   ├── DatabaseModule.ts
│   ├── data-source.ts
│   └── migrations/
├── shared/
│   ├── decorator/            # Custom validators
│   ├── dto/                  # PaginationResultDto
│   ├── error/                # DuplicateEntityError, NotFoundEntityError, etc.
│   └── interface/
├── interceptors/
│   ├── HttpExceptionFilter.ts
│   └── httpExceptionMap.ts
├── auth/                     # JWT-based auth (reference module)
└── users/                    # User management (reference module)
```

### Key Patterns to Follow

1. **Module Structure**: `[Module]Module.ts`, `controller/`, `service/`, `dto/`, `entity/`, `interface/`
2. **Entity Pattern**: TypeORM with proper column naming, indexes, relationships
3. **Service Pattern**: Repository injection, transaction management
4. **Controller Pattern**: Swagger docs, validation, pagination
5. **Error Handling**: Custom exceptions → HttpExceptionFilter

---

## 3. Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)

#### 1.1 Company Module (Multi-tenancy Foundation)
- **Entity**: `Company` with settings JSON column
- **Endpoints**: CRUD operations
- **Business Logic**: Company settings validation, default settings

#### 1.2 Enhanced User Module
- Extend existing User entity with:
  - `companyId` (FK to Company)
  - `role` enum (admin, manager, user)
  - `permissions` JSON column
  - `avatar`, `lastLogin`
- **Endpoints**: Filter by company, role management
- **Guards**: `CompanyGuard` for multi-tenant isolation

#### 1.3 Auth Enhancements
- Registration with company creation
- JWT payload with companyId and role
- Permission-based guards

### Phase 2: Product Catalog (Week 2-3)

#### 2.1 Product Module
- **Entity**: Product with category, type enums
- **Endpoints**: CRUD, filter by company/category
- **Business Logic**: SKU uniqueness per company

#### 2.2 Client Module
- **Entity**: Client with company association
- **Endpoints**: CRUD, filter by company

#### 2.3 Vendor Module
- **Entity**: Vendor with company association
- **Endpoints**: CRUD, filter by company

### Phase 3: Transactions (Week 3-4)

#### 3.1 Sale Module
- **Entities**: Sale, SaleLineItem
- **Endpoints**: CRUD, status updates, reporting
- **Business Logic**:
  - Invoice number generation
  - Line item calculations (subtotal, tax, total)
  - Inventory deduction on payment

#### 3.2 Purchase Module
- **Entities**: Purchase, PurchaseLineItem
- **Endpoints**: CRUD, status updates
- **Business Logic**:
  - PO number generation
  - Line item calculations
  - Inventory addition on receipt

### Phase 4: Inventory Management (Week 4-5)

#### 4.1 Inventory Module
- **Entities**: InventoryItem, InventoryMovement, InventoryAlert
- **Endpoints**:
  - CRUD for items
  - Movements history
  - Alerts management
- **Business Logic**:
  - Automatic alert generation on low stock
  - Movement tracking for sales/purchases

### Phase 5: Installations/Projects (Week 5-6)

#### 5.1 Installation Module
- **Entities**: Installation, InstallationEvent, InstallationPhoto
- **Endpoints**:
  - CRUD for installations
  - Event management with photo upload
  - Team assignment
- **Business Logic**:
  - Project number generation
  - Status workflow
  - File upload handling (S3 or local)

---

## 4. Database Schema Design

### Entity Relationship Diagram (Conceptual)

```
┌─────────────┐
│   Company   │
├─────────────┤
│ id (PK)     │
│ name        │
│ email       │
│ settings    │◄───────────────────────────────────────────┐
└─────────────┘                                            │
      │                                                    │
      │ 1:N                                                │
      ▼                                                    │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│    User     │     │   Product   │     │   Client    │   │
├─────────────┤     ├─────────────┤     ├─────────────┤   │
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │   │
│ companyId   │────►│ companyId   │◄────│ companyId   │───┘
│ role        │     │ sku         │     │ name        │
│ permissions │     │ category    │     │ email       │
└─────────────┘     │ type        │     └─────────────┘
                    └─────────────┘            │
                          │                    │
                          │ 1:N                │ 1:N
                          ▼                    │
                    ┌──────────────┐           │
                    │InventoryItem │           │
                    ├──────────────┤           │
                    │ id (PK)      │           │
                    │ productId    │           │
                    │ quantity     │           │
                    └──────────────┘           │
                                               │
┌─────────────┐     ┌─────────────────┐        │
│    Sale     │     │  SaleLineItem   │        │
├─────────────┤     ├─────────────────┤        │
│ id (PK)     │     │ id (PK)         │        │
│ companyId   │────►│ saleId          │        │
│ customerId  │─────│ productId       │        │
│ status      │     │ quantity        │        │
└─────────────┘     └─────────────────┘        │
                                               │
┌─────────────┐     ┌──────────────────┐       │
│  Purchase   │     │PurchaseLineItem  │       │
├─────────────┤     ├──────────────────┤       │
│ id (PK)     │     │ id (PK)          │       │
│ companyId   │────►│ purchaseId       │       │
│ vendorId    │     │ productId        │       │
│ status      │     │ quantity         │       │
└─────────────┘     └──────────────────┘       │
                                               │
┌──────────────────┐                           │
│   Installation   │                           │
├──────────────────┤                           │
│ id (PK)          │                           │
│ companyId        │───────────────────────────┘
│ customerId       │
│ status           │
└──────────────────┘
        │
        │ 1:N
        ▼
┌───────────────────┐
│InstallationEvent  │
├───────────────────┤
│ id (PK)           │
│ installationId    │
│ photos (JSON)     │
└───────────────────┘
```

---

## 5. API Endpoint Design

### Base URL: `/api/v1`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | Register with company |
| POST | `/auth/refresh` | Refresh token |
| GET | `/auth/me` | Current user info |

### Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | List companies (admin only) |
| GET | `/companies/:id` | Get company |
| POST | `/companies` | Create company |
| PATCH | `/companies/:id` | Update company |
| DELETE | `/companies/:id` | Delete company |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users (filtered by company) |
| GET | `/users/:id` | Get user |
| POST | `/users` | Create user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (filtered by company) |
| GET | `/products/:id` | Get product |
| POST | `/products` | Create product |
| PATCH | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/clients` | List clients |
| GET | `/clients/:id` | Get client |
| POST | `/clients` | Create client |
| PATCH | `/clients/:id` | Update client |
| DELETE | `/clients/:id` | Delete client |

### Vendors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vendors` | List vendors |
| GET | `/vendors/:id` | Get vendor |
| POST | `/vendors` | Create vendor |
| PATCH | `/vendors/:id` | Update vendor |
| DELETE | `/vendors/:id` | Delete vendor |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sales` | List sales |
| GET | `/sales/:id` | Get sale with line items |
| POST | `/sales` | Create sale |
| PATCH | `/sales/:id` | Update sale |
| PATCH | `/sales/:id/status` | Update sale status |
| DELETE | `/sales/:id` | Delete sale |

### Purchases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchases` | List purchases |
| GET | `/purchases/:id` | Get purchase with line items |
| POST | `/purchases` | Create purchase |
| PATCH | `/purchases/:id` | Update purchase |
| PATCH | `/purchases/:id/status` | Update purchase status |
| DELETE | `/purchases/:id` | Delete purchase |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory` | List inventory items |
| GET | `/inventory/:id` | Get inventory item |
| POST | `/inventory` | Create inventory item |
| PATCH | `/inventory/:id` | Update inventory item |
| GET | `/inventory/:id/movements` | Get movements history |
| POST | `/inventory/:id/movements` | Create manual adjustment |
| GET | `/inventory/alerts` | Get low stock alerts |

### Installations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/installations` | List installations |
| GET | `/installations/:id` | Get installation with events |
| POST | `/installations` | Create installation |
| PATCH | `/installations/:id` | Update installation |
| DELETE | `/installations/:id` | Delete installation |
| POST | `/installations/:id/events` | Add event with photos |
| PATCH | `/installations/:id/events/:eventId` | Update event |
| DELETE | `/installations/:id/events/:eventId` | Delete event |

---

## 6. Technical Decisions

### Multi-Tenancy Strategy
- **Approach**: Discriminator column (`companyId`)
- **Implementation**: Custom decorator + guard for automatic company filtering
- **Data Isolation**: All queries filtered by user's companyId

### Authentication & Authorization
- **Auth**: JWT with refresh tokens
- **RBAC**: Role-based with permission overrides
- **Guards**: `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`

### File Upload (Installations)
- **Strategy**: Options to discuss
  - A) AWS S3 with presigned URLs
  - B) Local filesystem with static serving
  - C) Base64 in database (for small images)

### Database Migrations
- **Tool**: TypeORM migrations
- **Strategy**: Generate migrations for each phase

### Testing Strategy
- **Unit Tests**: Jest for services, >80% coverage
- **Integration Tests**: Supertest for controllers
- **E2E Tests**: Full API flow testing

---

## 7. Branch Strategy

- **Branch Name**: `feat/umbrella-backend-api`
- **Base Branch**: `develop` (create if doesn't exist)
- **Target Branch**: `develop`
- **Review Requirements**: 1 reviewer before merge

### Development Branches
```
develop
  └── feat/umbrella-backend-api
       ├── feat/company-module
       ├── feat/user-enhancements
       ├── feat/product-module
       ├── feat/client-vendor-modules
       ├── feat/sales-module
       ├── feat/purchases-module
       ├── feat/inventory-module
       └── feat/installations-module
```

---

## 8. Team Selection for Advice

### Selected Agents
1. **nestjs-backend-architect**: Primary agent for:
   - Entity design and relationships
   - Service patterns and business logic
   - Multi-tenancy implementation
   - Guard and interceptor design
   - Testing strategy

### Questions for Agent
1. Multi-tenancy: Column-based vs Schema-based approach?
2. Line items: Embedded JSON vs Separate table?
3. Inventory movements: Event sourcing vs CRUD?
4. File upload strategy for installation photos?
5. Permission guard implementation patterns?

---

## 9. Final Decisions (User Confirmed)

| Question | Decision |
|----------|----------|
| **File Storage** | AWS S3 with presigned URLs |
| **Real-time Updates** | REST only (no WebSocket) |
| **Database** | PostgreSQL (already configured) |
| **Project Setup** | Clone base_project_nest repository to new location |
| **Authentication** | JWT (existing base project approach) |

---

## 10. NestJS Backend Architect Recommendations

### Key Architectural Decisions (from Agent Advice)

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| **Multi-tenancy** | Column-based with `@CompanyContext()` | Simple, flexible, existing PostgreSQL setup |
| **Line Items** | Separate tables with FK | Query performance, data integrity, TypeORM support |
| **Inventory** | CRUD + automated movements | Sufficient audit trail, simpler than event sourcing |
| **Permissions** | Combined Roles + Permissions guards | Flexible, granular, hierarchical |
| **File Storage** | S3 presigned URLs + local fallback | Scalable, secure, cost-effective |
| **Transactions** | DataSource.transaction with EntityManager | Atomic operations, automatic rollback |

### Multi-Tenancy Implementation Pattern

```typescript
// CompanyContextGuard - extracts companyId from JWT
@Injectable()
export class CompanyContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.companyId) throw new UnauthorizedException('No company context');
    request.companyId = user.companyId;
    return true;
  }
}

// @CompanyContext() decorator for controllers
export const CompanyContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().companyId;
  },
);
```

### Permission Guard Pattern

```typescript
// Combined Roles + Permissions
@Controller('products')
@UseGuards(JwtAuthGuard, CompanyContextGuard, RolesGuard, PermissionsGuard)
export class ProductController {
  @Get()
  @Permissions('products:read')
  async findAll(@CompanyContext() companyId: string) { ... }

  @Post()
  @Roles('admin', 'manager')
  @Permissions('products:write')
  async create(...) { ... }
}
```

### Transaction Pattern for Complex Operations

```typescript
async create(companyId: string, dto: CreateSaleDto): Promise<Sale> {
  return this.dataSource.transaction(async (manager) => {
    // 1. Create sale
    // 2. Create line items
    // 3. Update totals
    // 4. Record inventory movements (if paid)
    // All or nothing - automatic rollback on error
  });
}
```

### File Upload Strategy (S3 Presigned URLs)

1. Client requests upload URL from backend
2. Backend generates presigned S3 URL (5 min expiry)
3. Client uploads directly to S3
4. Client confirms upload with metadata
5. Backend creates photo record

---

## 11. Iteration Log

### Iteration 1 (2025-12-31)
- Initial exploration of Angular frontend models
- Analysis of NestJS base project structure
- Created initial implementation plan
- Received comprehensive advice from nestjs-backend-architect agent
- Finalized architectural decisions

### Key Findings
- Frontend has 11 core entities with CRUD operations
- Multi-tenancy via `companyId` column is the recommended approach
- Separate tables for line items (not JSON) for query performance
- S3 presigned URLs for file storage with local fallback for dev

---

## 12. Implementation Instructions

### Prerequisites

Before starting development, ensure you have:
- Node.js 20+ installed
- PostgreSQL 15+ running locally or accessible
- AWS account with S3 bucket (for file uploads)
- Git configured

### Step 1: Clone and Setup Project

```bash
# Clone the base project to a new directory
git clone <base_project_nest_repo_url> umbrella-backend
cd umbrella-backend

# Install dependencies
yarn install

# Create environment files
cp environment/base.env environment/local.env
```

### Step 2: Configure Environment Variables

Edit `environment/local.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=umbrella_db
DB_SCHEMA=umbrella

# JWT
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d

# AWS S3 (for file uploads)
STORAGE_TYPE=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=umbrella-uploads

# Application
PORT=3000
NODE_ENV=development
```

### Step 3: Database Setup

```bash
# Create database
createdb umbrella_db

# Run migrations (after creating entities)
yarn db:migrate
```

### Step 4: Module Implementation Order

Implement modules in this order to respect dependencies:

#### Phase 1: Core Infrastructure

1. **Shared Module Enhancements**
   - Add `@CompanyContext()` decorator
   - Add `CompanyContextGuard`
   - Add `@Permissions()` decorator
   - Add `PermissionsGuard`
   - Add `@Roles()` decorator
   - Add `RolesGuard`

2. **Company Module** (NEW)
   ```
   src/company/
   ├── CompanyModule.ts
   ├── entity/Company.ts
   ├── dto/
   │   ├── CreateCompanyPayloadDto.ts
   │   ├── UpdateCompanyPayloadDto.ts
   │   └── CompanyDto.ts
   ├── service/CompanyService.ts
   ├── controller/CompanyController.ts
   └── interface/CompanySettings.ts
   ```

3. **User Module Enhancements** (MODIFY)
   - Add `companyId` FK to User entity
   - Add `role` enum column
   - Add `permissions` JSON column
   - Add company filtering to all queries

4. **Auth Module Enhancements** (MODIFY)
   - Add registration endpoint (creates company + admin user)
   - Include `companyId` and `role` in JWT payload
   - Add refresh token support

#### Phase 2: Product Catalog

5. **Product Module** (NEW)
   ```
   src/product/
   ├── ProductModule.ts
   ├── entity/Product.ts
   ├── dto/...
   ├── service/ProductService.ts
   └── controller/ProductController.ts
   ```

6. **Client Module** (NEW)
   ```
   src/client/
   ├── ClientModule.ts
   ├── entity/Client.ts
   ├── dto/...
   ├── service/ClientService.ts
   └── controller/ClientController.ts
   ```

7. **Vendor Module** (NEW)
   ```
   src/vendor/
   ├── VendorModule.ts
   ├── entity/Vendor.ts
   ├── dto/...
   ├── service/VendorService.ts
   └── controller/VendorController.ts
   ```

#### Phase 3: Transactions

8. **Sale Module** (NEW)
   ```
   src/sale/
   ├── SaleModule.ts
   ├── entity/
   │   ├── Sale.ts
   │   └── SaleLineItem.ts
   ├── dto/...
   ├── service/SaleService.ts
   └── controller/SaleController.ts
   ```

9. **Purchase Module** (NEW)
   ```
   src/purchase/
   ├── PurchaseModule.ts
   ├── entity/
   │   ├── Purchase.ts
   │   └── PurchaseLineItem.ts
   ├── dto/...
   ├── service/PurchaseService.ts
   └── controller/PurchaseController.ts
   ```

#### Phase 4: Inventory

10. **Inventory Module** (NEW)
    ```
    src/inventory/
    ├── InventoryModule.ts
    ├── entity/
    │   ├── InventoryItem.ts
    │   ├── InventoryMovement.ts
    │   └── InventoryAlert.ts
    ├── dto/...
    ├── service/InventoryService.ts
    └── controller/InventoryController.ts
    ```

#### Phase 5: Installations

11. **File Upload Module** (NEW)
    ```
    src/file-upload/
    ├── FileUploadModule.ts
    ├── service/FileUploadService.ts
    └── controller/FileUploadController.ts
    ```

12. **Installation Module** (NEW)
    ```
    src/installation/
    ├── InstallationModule.ts
    ├── entity/
    │   ├── Installation.ts
    │   ├── InstallationEvent.ts
    │   └── InstallationPhoto.ts
    ├── dto/...
    ├── service/InstallationService.ts
    └── controller/InstallationController.ts
    ```

### Step 5: Entity Schemas

#### Company Entity

```typescript
@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 50 })
  taxId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string | null;

  @Column({ type: 'jsonb' })
  settings: CompanySettings;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'inactive';

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

interface CompanySettings {
  currency: 'USD' | 'EUR' | 'GBP' | 'MXN' | 'CAD' | 'AUD' | 'JPY' | 'CHF';
  plan: 'free' | 'basic' | 'premium';
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
  taxRate: number;
  invoicePrefix: string;
  purchaseOrderPrefix: string;
  allowNegativeInventory: boolean;
  lowStockThreshold: number;
}
```

#### Enhanced User Entity

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index('idx_user_company')
  companyId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'first_name', type: 'varchar', length: 150 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 150 })
  lastName: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20 })
  role: 'admin' | 'manager' | 'user';

  @Column({ type: 'jsonb' })
  permissions: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  lastLogin: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
```

### Step 6: API Endpoints Summary

| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/login, POST /auth/register, POST /auth/refresh, GET /auth/me |
| Companies | GET/POST/PATCH/DELETE /companies, GET /companies/:id |
| Users | GET/POST/PATCH/DELETE /users, GET /users/:id |
| Products | GET/POST/PATCH/DELETE /products, GET /products/:id |
| Clients | GET/POST/PATCH/DELETE /clients, GET /clients/:id |
| Vendors | GET/POST/PATCH/DELETE /vendors, GET /vendors/:id |
| Sales | GET/POST/PATCH/DELETE /sales, GET /sales/:id, PATCH /sales/:id/status |
| Purchases | GET/POST/PATCH/DELETE /purchases, GET /purchases/:id, PATCH /purchases/:id/status |
| Inventory | GET/POST/PATCH /inventory, GET /inventory/:id, GET /inventory/:id/movements, POST /inventory/:id/movements, GET /inventory/alerts |
| Installations | GET/POST/PATCH/DELETE /installations, GET /installations/:id, POST /installations/:id/events, PATCH/DELETE /installations/:id/events/:eventId |
| Files | POST /files/upload-url, POST /files/confirm, GET /files/:id/download-url |

### Step 7: Testing Strategy

For each module, create:

1. **Service Unit Tests** (`*.service.spec.ts`)
   - Mock repository
   - Test business logic
   - Test error handling

2. **Controller Unit Tests** (`*.controller.spec.ts`)
   - Mock service
   - Test request validation
   - Test response format

3. **Integration Tests** (e2e folder)
   - Full request/response cycle
   - Database transactions
   - Multi-tenant isolation

### Step 8: Swagger Documentation

Add Swagger decorators to all endpoints:

```typescript
@ApiTags('Products')
@ApiOperation({ summary: 'Create a new product' })
@ApiResponse({ status: 201, description: 'Product created', type: ProductDto })
@ApiResponse({ status: 400, description: 'Validation error' })
@ApiBearerAuth()
```

### Step 9: Migration Generation

After creating entities, generate migrations:

```bash
# Generate migration
DEPLOY_ENV=local yarn migration:generate src/database/migrations/AddUmbrellaEntities

# Run migration
DEPLOY_ENV=local yarn db:migrate
```

### Step 10: Run the Application

```bash
# Development mode
DEPLOY_ENV=local yarn start:dev

# Access Swagger docs
open http://localhost:3000/api
```

---

## 13. Development Checklist

### Phase 1: Core Infrastructure
- [ ] Create shared decorators (@CompanyContext, @Permissions, @Roles)
- [ ] Create guards (CompanyContextGuard, PermissionsGuard, RolesGuard)
- [ ] Create Company module with entity, service, controller
- [ ] Enhance User entity with companyId, role, permissions
- [ ] Enhance Auth module with registration and JWT payload

### Phase 2: Product Catalog
- [ ] Create Product module
- [ ] Create Client module
- [ ] Create Vendor module
- [ ] Generate and run migrations

### Phase 3: Transactions
- [ ] Create Sale module with line items
- [ ] Create Purchase module with line items
- [ ] Implement automatic totals calculation
- [ ] Implement status workflow

### Phase 4: Inventory
- [ ] Create InventoryItem entity
- [ ] Create InventoryMovement entity
- [ ] Create InventoryAlert entity
- [ ] Implement automatic movements on sale/purchase

### Phase 5: Installations
- [ ] Create FileUpload module with S3 integration
- [ ] Create Installation module
- [ ] Create InstallationEvent entity
- [ ] Create InstallationPhoto entity

### Phase 6: Testing & Documentation
- [ ] Write unit tests (>80% coverage)
- [ ] Write integration tests
- [ ] Complete Swagger documentation
- [ ] Write README with setup instructions

---

*Last Updated: 2025-12-31*
*Status: Plan Complete - Ready for Implementation*
