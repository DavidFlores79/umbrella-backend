# Umbrella Backend Development Plan

## Session Information
- **Feature**: umbrella-backend
- **Created**: 2025-12-31
- **Status**: Phase 2 Complete - S3Service Integration (2026-01-12)
- **Target Repository**: `/Users/LAPTOP-david-001/Development/apps/Nest/umbrella-backend`
- **Branch**: `feat/umbrella-backend-api`
- **PR**: https://github.com/DavidFlores79/umbrella-backend/pull/1

---

## Implementation Progress (2026-01-12) - Phase 2: S3Service Integration

### S3Service Implementation ✅

| Component | Status | Notes |
|-----------|--------|-------|
| **AWS SDK Packages** | ✅ Complete | @aws-sdk/client-s3, @aws-sdk/s3-request-presigner installed |
| **S3Service** | ✅ Complete | src/shared/service/S3Service.ts with presigned URLs |
| **S3Service Tests** | ✅ Complete | 11 comprehensive unit tests |
| **Environment Config** | ✅ Complete | AWS variables added to EnvironmentVariables interface |
| **Base Environment** | ✅ Complete | AWS placeholders in environment/base.env |
| **Secret Removal** | ✅ Complete | All secrets replaced with placeholders |

### S3Service Features
- `getSignedUploadUrl()` - Generate presigned URLs for client-side uploads (5 min expiry)
- `getSignedDownloadUrl()` - Generate presigned URLs for downloads
- `uploadFile()` - Direct server-side file upload to S3
- `copyFile()` - Copy files within S3
- `deleteFile()` - Delete files from S3
- `getClient()` - Access S3Client for advanced operations
- `getBucketName()` - Get configured bucket name

### Test Coverage Summary (Phase 2)
- **Statement Coverage**: 76.17%
- **Branch Coverage**: 54.59%
- **Function Coverage**: 64.21%
- **Line Coverage**: 77.07%
- **Total Tests**: 203 passing (192 existing + 11 new S3Service tests)

### Commits
- `001b942` - refactor: remove authentication guards and update company context extraction
- `9260bd7` - feat: add S3Service for file storage with AWS integration

### Entities with Image Fields (Ready for S3)
- Company.logo (line 57) - S3 key for company logo
- Product.image (line 86) - S3 key for product image
- User.avatar (line 167-168) - S3 key for user avatar

---

## Implementation Progress (2026-01-02)

### Unit Tests Added

| Module | Test File | Tests | Status |
|--------|-----------|-------|--------|
| **CompanyService** | `company/service/CompanyService.spec.ts` | CRUD, settings merge, unique email | ✅ Complete |
| **CompanyController** | `company/controller/CompanyController.spec.ts` | Endpoints with guard overrides | ✅ Complete |
| **ProductService** | `product/service/ProductService.spec.ts` | CRUD, SKU uniqueness, inventory | ✅ Complete |
| **ProductController** | `product/controller/ProductController.spec.ts` | Endpoints with guard overrides | ✅ Complete |
| **ClientService** | `client/service/ClientService.spec.ts` | CRUD, email validation | ✅ Complete |
| **ClientController** | `client/controller/ClientController.spec.ts` | Endpoints with guard overrides | ✅ Complete |
| **VendorService** | `vendor/service/VendorService.spec.ts` | CRUD, email validation | ✅ Complete |
| **VendorController** | `vendor/controller/VendorController.spec.ts` | Endpoints with guard overrides | ✅ Complete |
| **SaleService** | `sale/service/SaleService.spec.ts` | CRUD, line items, totals, status | ✅ Complete |
| **SaleController** | `sale/controller/SaleController.spec.ts` | Endpoints with guard overrides | ✅ Complete |
| **PurchaseService** | `purchase/service/PurchaseService.spec.ts` | CRUD, line items, totals, status | ✅ Complete |
| **PurchaseController** | `purchase/controller/PurchaseController.spec.ts` | Endpoints with guard overrides | ✅ Complete |

### Test Coverage Summary
- **Statement Coverage**: 76.55%
- **Branch Coverage**: 52.38%
- **Function Coverage**: 62.14%
- **Line Coverage**: 77.4%
- **Total Tests**: 192 passing

### Key Technical Details
- Controller tests override guards (JwtAuthGuard, CompanyContextGuard, PermissionsGuard, RolesGuard) to avoid dependency resolution issues
- Service tests mock repositories and DataSource transactions
- Optimistic locking tested with `OutdatedEntityVersionError`
- Multi-tenant isolation tested with `companyId` parameter

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

## 14. Wallet-Service Alignment Analysis (2026-01-02)

### Context
David requested architectural alignment analysis between umbrella-backend and wallet-service to identify patterns worth adopting while respecting different business requirements (multi-tenant business management vs financial services).

### Key Findings

**Wallet-Service Architecture Patterns**:
1. RSA-based JWT (private/public key pair, base64-encoded)
2. Global JwtModule in AppModule (not in AuthModule)
3. GeolocationGuard for regulatory compliance (Mexico-only)
4. S3Service for document storage in shared module
5. No endpoint-level JWT guards (unauthenticated endpoints)
6. libs/ folder for external integrations

**Umbrella-Backend Current State**:
1. Secret-based JWT (simple secret key)
2. JwtModule in AuthModule
3. Comprehensive guards (JwtAuth, CompanyContext, Roles, Permissions)
4. AWS credentials configured, S3Service not implemented
5. Multi-tenant column-based isolation with companyId
6. Module-based structure (no libs/ folder)

### Architectural Recommendations

| Recommendation | Priority | Decision | Rationale |
|----------------|----------|----------|-----------|
| **RSA-Based JWT + Global Module** | **HIGH** | **ADOPT** | Security, scalability, industry best practice for multi-tenant systems |
| **Keep Multi-Tenant Guards** | **CRITICAL** | **NO CHANGE** | Business requirement - different security model from wallet-service |
| **GeolocationService** | **LOW** | **DEFER** | No current regulatory requirement for business management software |
| **S3Service Integration** | **HIGH** | **ADOPT** | Required for installation photos, proven pattern, env vars already configured |
| **libs/ Folder Structure** | **LOW** | **REJECT** | Not needed for single-app NestJS, follow NestJS module conventions |
| **JWT Environment Variables** | **HIGH** | **UPDATE** | Part of RSA migration, align naming with wallet-service |

### Implementation Roadmap

**Phase 1: JWT RSA Migration** (Week 1)
- Generate RSA key pairs for all environments
- Move JwtModule to AppModule with RSA configuration
- Update AuthModule (remove JwtModule)
- Update JwtAuthGuard to use public key verification
- Update AuthService token generation with RSA signing
- Update EnvironmentVariables validation
- Testing: Token generation, verification, multi-tenant claims

**Phase 2: S3Service Integration** (Week 2)
- Install AWS SDK (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
- Create S3Service in shared/service/
- Create FileUploadModule with presigned URL endpoints
- Implement upload/download workflow
- Testing: Presigned URL generation, file upload flow

**Phase 3: Installation Photos Module** (Week 3)
- Create InstallationPhoto entity with S3 key field
- Implement photo upload workflow using S3Service
- Generate database migration
- Testing: End-to-end photo upload/download

### Critical Decisions

1. **JWT Migration is Breaking Change**:
   - All active sessions will be invalidated
   - Requires user re-authentication
   - Deploy during maintenance window
   - Consider temporary dual-token support (accept old + new tokens during transition)

2. **Multi-Tenant Guards MUST Stay**:
   - Wallet-service has no JWT guards because it uses external API gateway authentication
   - Umbrella-backend requires endpoint-level multi-tenant isolation
   - JwtAuthGuard, CompanyContextGuard, RolesGuard, PermissionsGuard are critical for business logic

3. **S3Service Direct Adoption**:
   - Wallet-service implementation is production-tested
   - Environment variables already configured in umbrella-backend
   - Presigned URLs provide secure, scalable file upload

### Documentation Created

- **File**: `.claude/doc/umbrella_backend/wallet-service-alignment-analysis.md`
- **Contents**:
  - Detailed comparison of both architectures
  - Step-by-step implementation guides for RSA JWT migration
  - Complete S3Service implementation with code examples
  - Testing strategy and migration risks
  - Environment variable alignment

### Next Steps

1. Review alignment analysis with David
2. Get approval for RSA JWT migration (breaking change)
3. Prioritize implementation phases
4. Begin RSA JWT migration (highest security impact)
5. Follow with S3Service integration (required for photos)

---

## 15. REVISED Architecture Plan - Full Wallet-Service Alignment (2026-01-02)

### David's Decisions (from clarification questions)

| Question | Decision |
|----------|----------|
| **JWT Migration** | Copy wallet-service approach - API gateway authentication |
| **Implementation Priority** | S3Service only (first priority) |
| **API Design** | Copy wallet-service way - Internal APIs for BFF consumption |
| **Guards Removal** | Remove ALL guards - Full wallet-service pattern |
| **Company Context** | X-Company-Id header from BFF (trusted header) |

### Revised Architecture: Full Wallet-Service Pattern

**Key Changes from Current State:**

1. **Remove ALL Endpoint Guards**
   - Delete: `JwtAuthGuard`, `CompanyContextGuard`, `RolesGuard`, `PermissionsGuard`
   - Authentication handled by external API gateway
   - Authorization handled by BFF layer
   - Umbrella-backend endpoints are "unauthenticated" (trust network/gateway)

2. **Company Context via Header**
   - BFF sends `X-Company-Id` header after authenticating user
   - Umbrella-backend trusts this header unconditionally
   - Create decorator to extract company context from header (not JWT)
   - All multi-tenant queries use companyId from header

3. **Internal API Design**
   - APIs optimized for BFF consumption, not direct frontend use
   - Frontend → BFF → umbrella-backend → Database
   - BFF handles user session, JWT validation, permission checks
   - Umbrella-backend handles pure business logic and data access

4. **S3Service Priority**
   - First implementation priority
   - Copy wallet-service S3Service pattern exactly
   - Enable file upload for installation photos

### Files to REMOVE

```
src/shared/guard/
├── JwtAuthGuard.ts          # DELETE
├── CompanyContextGuard.ts   # DELETE
├── RolesGuard.ts            # DELETE
├── PermissionsGuard.ts      # DELETE
└── index.ts                 # DELETE (or update)

src/shared/decorator/
├── CurrentUser.ts           # DELETE (no JWT user)
├── Roles.ts                 # DELETE (roles in BFF)
├── Permissions.ts           # DELETE (permissions in BFF)
```

### Files to MODIFY

**1. `@CompanyContext()` Decorator** - Change to extract from header:
```typescript
// BEFORE: Extract from JWT user
export const CompanyContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.companyId; // From JWT
  },
);

// AFTER: Extract from X-Company-Id header
export const CompanyContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const companyId = request.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('X-Company-Id header is required');
    }
    return companyId;
  },
);
```

**2. All Controllers** - Remove guard decorators:
```typescript
// BEFORE
@Controller('products')
@UseGuards(JwtAuthGuard, CompanyContextGuard, RolesGuard, PermissionsGuard)
export class ProductController {
  @Get()
  @Permissions('products:read')
  async findAll(@CompanyContext() companyId: string) { ... }
}

// AFTER
@Controller('products')
export class ProductController {
  @Get()
  async findAll(@CompanyContext() companyId: string) { ... }
}
```

**3. AuthModule** - Keep for token generation, remove guards:
```typescript
// Auth endpoints remain for token generation
// But no guards on endpoints - BFF handles auth
@Controller('auth')
export class AuthController {
  @Post('login')
  async signIn(@Body() dto: SignInUserPayloadDto) { ... }

  @Post('register')
  async signUp(@Body() dto: SignUpPayloadDto) { ... }
}
```

### Files to CREATE

**S3Service** (`src/shared/service/S3Service.ts`) - Shared across ALL modules:
```typescript
// Copy wallet-service implementation exactly
@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService<EnvironmentVariables>) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION_NAME'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get('AWS_BUCKET_NAME');
  }

  async getSignedUploadUrl(key: string): Promise<string> { ... }
  async getSignedDownloadUrl(key: string): Promise<string> { ... }
  async uploadFile(key, buffer, contentType): Promise<{etag, bucket, key}> { ... }
  async copyFile(destinationKey, copySource): Promise<{etag, bucket, key}> { ... }
  async deleteFile(key: string): Promise<void> { ... }
  getClient(): S3Client { ... }
  getBucketName(): string { ... }
}
```

**NO FileUploadModule** - Each module handles its own upload logic using S3Service directly.

### S3 Key Naming Convention

Each module generates S3 keys with this pattern:
```
{module}/{companyId}/{entityId}/{filename}

Examples:
- installations/{companyId}/{installationId}/photos/{uuid}.jpg
- products/{companyId}/{productId}/images/{uuid}.jpg
- companies/{companyId}/logo/{uuid}.png
- users/{companyId}/{userId}/avatar/{uuid}.jpg
- documents/{companyId}/{documentType}/{uuid}.pdf
```

### Modules Using S3Service

| Module | Entity Field | S3 Key Pattern | Use Case |
|--------|--------------|----------------|----------|
| **Installation** | InstallationPhoto.s3Key | `installations/{cid}/{iid}/photos/{uuid}.jpg` | Before/after photos, progress |
| **Product** | Product.imageKey | `products/{cid}/{pid}/images/{uuid}.jpg` | Product images |
| **Company** | Company.logo | `companies/{cid}/logo/{uuid}.png` | Company logo |
| **User** | User.avatar | `users/{cid}/{uid}/avatar/{uuid}.jpg` | Profile photos |

### Example: Module Using S3Service

```typescript
// InstallationService example
@Injectable()
export class InstallationService {
  constructor(
    private s3Service: S3Service,
    @InjectRepository(InstallationPhoto)
    private photoRepository: Repository<InstallationPhoto>,
  ) {}

  async getPhotoUploadUrl(installationId: string, companyId: string) {
    const key = `installations/${companyId}/${installationId}/photos/${uuid()}.jpg`;
    const uploadUrl = await this.s3Service.getSignedUploadUrl(key);
    return { uploadUrl, key };
  }

  async confirmPhotoUpload(key: string, installationId: string) {
    const photo = this.photoRepository.create({ s3Key: key, installationId });
    return this.photoRepository.save(photo);
  }

  async getPhotoDownloadUrl(photoId: string) {
    const photo = await this.photoRepository.findOneByOrFail({ id: photoId });
    return this.s3Service.getSignedDownloadUrl(photo.s3Key);
  }
}
```

### Implementation Phases (REVISED)

**Phase 1: Remove Guards & Update Company Context (Day 1)**
1. Delete guard files from `src/shared/guard/`
2. Delete unused decorator files (`CurrentUser.ts`, `Roles.ts`, `Permissions.ts`)
3. Update `@CompanyContext()` to extract from `X-Company-Id` header
4. Remove `@UseGuards()` decorators from ALL controllers
5. Remove `@Roles()` and `@Permissions()` decorators from ALL controllers
6. Update controller tests (remove guard overrides, add header mocking)

**Phase 2: S3Service Integration (Day 2-3)**
1. Install AWS SDK packages:
   ```bash
   yarn add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```
2. Create S3Service in `src/shared/service/S3Service.ts` (copy wallet-service implementation)
3. Update EnvironmentVariables interface with AWS credentials
4. Update environment files (base.env, local.env)
5. Add S3Service unit tests

**Phase 3: Update Existing Entities for S3 (Day 3)**
1. Add S3 key fields to existing entities:
   - `Company.logo` (string, nullable) - S3 key for company logo
   - `User.avatar` (string, nullable) - Already exists
   - `Product.imageKey` (string, nullable) - S3 key for product image
2. Generate and run database migration
3. Update DTOs to include image fields
4. Add upload/download methods to respective services

**Phase 4: Update Tests (Day 4-5)**
1. Remove guard-related test setup from all controller tests
2. Add X-Company-Id header mocking to all controller tests
3. Add S3Service unit tests
4. Update existing controller tests (remove guard overrides)
5. Ensure >80% test coverage maintained

**Phase 5: Installation Module (Future PR - Deferred)**
1. Create Installation, InstallationEvent, InstallationPhoto entities
2. Implement installation photo upload workflow using S3Service
3. Generate database migration
4. Add comprehensive tests

### Branch Strategy

- **Current Branch**: `feat/umbrella-backend-api` (continue on this branch)
- **Target Branch**: `develop`
- **No sub-branches needed** - changes are architectural, not feature-based

### Security Considerations

**This architecture assumes:**
1. Umbrella-backend runs in a private network (not exposed to internet)
2. Only BFF can reach umbrella-backend endpoints
3. API gateway validates JWT before forwarding to BFF
4. BFF adds X-Company-Id header after validating user's company access
5. Network-level security (VPC, firewall rules) enforces this boundary

**If umbrella-backend is exposed directly:**
- This architecture is NOT secure
- Guards would need to be kept
- Consider using wallet-service's API gateway pattern

### Modules Affected

| Module | Changes Needed |
|--------|----------------|
| **shared/guard/** | DELETE all files |
| **shared/decorator/** | Keep CompanyContext (modify), delete Roles/Permissions/CurrentUser |
| **shared/service/** | ADD S3Service |
| **company/** | Remove guards from controller, add logo field to entity |
| **product/** | Remove guards from controller, add imageKey field to entity |
| **client/** | Remove guards from controller |
| **vendor/** | Remove guards from controller |
| **sale/** | Remove guards from controller |
| **purchase/** | Remove guards from controller |
| **users/** | Remove guards from controller, avatar field already exists |
| **auth/** | Keep for token generation, remove guards |

### Test Updates Summary

All controller test files need updating:
- Remove `.overrideGuard(JwtAuthGuard)` chains
- Remove `.overrideGuard(CompanyContextGuard)` chains
- Remove `.overrideGuard(RolesGuard)` chains
- Remove `.overrideGuard(PermissionsGuard)` chains
- Add X-Company-Id header in test requests:
  ```typescript
  .set('X-Company-Id', mockCompanyId)
  ```

### Implementation Checklist

**Phase 1: Remove Guards & Update Company Context** ✅
- [ ] Delete `src/shared/guard/JwtAuthGuard.ts`
- [ ] Delete `src/shared/guard/CompanyContextGuard.ts`
- [ ] Delete `src/shared/guard/RolesGuard.ts`
- [ ] Delete `src/shared/guard/PermissionsGuard.ts`
- [ ] Delete `src/shared/guard/index.ts`
- [ ] Delete `src/shared/decorator/CurrentUser.ts`
- [ ] Delete `src/shared/decorator/Roles.ts`
- [ ] Delete `src/shared/decorator/Permissions.ts`
- [ ] Update `src/shared/decorator/CompanyContext.ts` to extract from header
- [ ] Remove guards from CompanyController
- [ ] Remove guards from ProductController
- [ ] Remove guards from ClientController
- [ ] Remove guards from VendorController
- [ ] Remove guards from SaleController
- [ ] Remove guards from PurchaseController
- [ ] Remove guards from UserController
- [ ] Remove guards from AuthController
- [ ] Update all controller tests (remove guard overrides, add header mocking)

**Phase 2: S3Service Integration** ✅
- [ ] Install `@aws-sdk/client-s3` package
- [ ] Install `@aws-sdk/s3-request-presigner` package
- [ ] Create `src/shared/service/S3Service.ts` (copy from wallet-service)
- [ ] Update `src/config/EnvironmentVariables.ts` with AWS variables
- [ ] Update `environment/base.env` with AWS placeholders
- [ ] Update `environment/local.env` with actual AWS credentials
- [ ] Create S3Service unit tests

**Phase 3: Update Entities for S3** ✅
- [ ] Add `logo: string | null` field to Company entity
- [ ] Add `imageKey: string | null` field to Product entity
- [ ] Verify `avatar: string | null` exists on User entity
- [ ] Update CompanyDto to include logo field
- [ ] Update ProductDto to include imageKey field
- [ ] Add `getLogoUploadUrl()` method to CompanyService
- [ ] Add `getImageUploadUrl()` method to ProductService
- [ ] Add `getAvatarUploadUrl()` method to UserService
- [ ] Generate database migration for new fields
- [ ] Run database migration

**Phase 4: Update Tests** ✅
- [ ] Update CompanyController tests (remove guards, add header)
- [ ] Update ProductController tests (remove guards, add header)
- [ ] Update ClientController tests (remove guards, add header)
- [ ] Update VendorController tests (remove guards, add header)
- [ ] Update SaleController tests (remove guards, add header)
- [ ] Update PurchaseController tests (remove guards, add header)
- [ ] Update UserController tests (remove guards, add header)
- [ ] Update AuthController tests (remove guards, add header)
- [ ] Add S3Service unit tests
- [ ] Run full test suite and verify >80% coverage

---

*Last Updated: 2026-01-12*
*Status: Plan Finalized - Simplified S3Service Approach - Ready for Implementation*
