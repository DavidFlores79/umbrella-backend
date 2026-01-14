# Wallet-Service Alignment Analysis for Umbrella-Backend

**Date**: 2026-01-02
**Prepared by**: NestJS Backend Architect
**Status**: Architectural Recommendations

---

## Executive Summary

This document provides specific architectural recommendations for aligning umbrella-backend with wallet-service patterns while respecting the fundamental differences between a multi-tenant business management system and a financial services platform.

**Key Recommendation**: **Selective Adoption** - Adopt wallet-service patterns that enhance security and scalability without compromising umbrella-backend's multi-tenant architecture and business logic requirements.

---

## 1. JWT Configuration Strategy

### Current State (umbrella-backend)

```typescript
// AuthModule.ts - JwtModule in AuthModule
JwtModule.registerAsync({
  useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
    secret: configService.get('JWT_SECRET') || 'default-secret-key',
    signOptions: {
      expiresIn: configService.get('JWT_EXPIRY') || '30m',
    },
  }),
  inject: [ConfigService],
})

// JwtAuthGuard.ts - Uses JWT_PRIVATE_KEY (confusing naming)
const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
  secret: this.configService.get<string>('JWT_PRIVATE_KEY'),
  issuer: this.configService.get<string>('JWT_ISSUER'),
});

// local.env - Secret-based configuration
JWT_SECRET=local-dev-secret-key-change-me
JWT_PRIVATE_KEY=local-dev-private-key  # Actually used as secret, not RSA key
JWT_ISSUER=umbrella-backend.local.paisamex.mx
```

### Wallet-Service Pattern (Target)

```typescript
// AppModule - JwtModule as global module
JwtModule.registerAsync({
  isGlobal: true,  // KEY DIFFERENCE
  useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
    privateKey: Buffer.from(
      configService.get('JWT_PRIVATE_KEY', { infer: true }),
      'base64',
    ).toString('utf8'),
    publicKey: Buffer.from(
      configService.get('JWT_PUBLIC_KEY', { infer: true }),
      'base64',
    ).toString('utf8'),
    signOptions: {
      algorithm: 'RS256',  // RSA-based signing
      issuer: configService.get('JWT_ISSUER', { infer: true }),
      expiresIn: configService.get('JWT_EXPIRY', { infer: true }) || '30m',
    },
    verifyOptions: {
      algorithms: ['RS256'],
      issuer: configService.get('JWT_ISSUER', { infer: true }),
    },
  }),
  inject: [ConfigService],
})
```

### **RECOMMENDATION 1: Migrate to RSA-Based JWT + Global Module**

**Priority**: HIGH (Security Enhancement)

**Rationale**:
1. **Security**: RSA key pairs provide asymmetric encryption, allowing public key distribution for token verification without exposing signing capability
2. **Scalability**: Multiple services can verify tokens using the public key without sharing the secret
3. **Best Practice**: Industry standard for production JWT implementations, especially for multi-tenant systems
4. **Future-Proof**: Enables microservices architecture where other services need to verify umbrella-backend tokens

**Implementation Plan**:

#### Step 1: Generate RSA Key Pair

```bash
# Generate RSA private key
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# Extract public key
openssl rsa -pubout -in private_key.pem -out public_key.pem

# Base64 encode for environment variables
cat private_key.pem | base64 > private_key_base64.txt
cat public_key.pem | base64 > public_key_base64.txt
```

#### Step 2: Update Environment Variables

```env
# environment/local.env
JWT_PRIVATE_KEY=<base64-encoded-private-key>
JWT_PUBLIC_KEY=<base64-encoded-public-key>
JWT_ISSUER=umbrella-backend.local.paisamex.mx
JWT_EXPIRY=30m

# Remove JWT_SECRET (deprecated)
```

#### Step 3: Move JwtModule to AppModule

```typescript
// src/AppModule.ts
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    // ... existing imports
    JwtModule.registerAsync({
      isGlobal: true,  // Makes JwtService available everywhere
      useFactory: (configService: ConfigService<EnvironmentVariables>) => {
        const privateKeyBase64 = configService.get('JWT_PRIVATE_KEY', { infer: true });
        const publicKeyBase64 = configService.get('JWT_PUBLIC_KEY', { infer: true });

        if (!privateKeyBase64 || !publicKeyBase64) {
          throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be configured');
        }

        return {
          privateKey: Buffer.from(privateKeyBase64, 'base64').toString('utf8'),
          publicKey: Buffer.from(publicKeyBase64, 'base64').toString('utf8'),
          signOptions: {
            algorithm: 'RS256',
            issuer: configService.get('JWT_ISSUER', { infer: true }),
            expiresIn: configService.get('JWT_EXPIRY', { infer: true }) || '30m',
          },
          verifyOptions: {
            algorithms: ['RS256'],
            issuer: configService.get('JWT_ISSUER', { infer: true }),
          },
        };
      },
      inject: [ConfigService],
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

#### Step 4: Update AuthModule (Remove JwtModule)

```typescript
// src/auth/AuthModule.ts
@Module({
  imports: [
    UserModule,
    SmsValidationModule,
    // JwtModule removed - now global from AppModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // Keep exporting AuthService
})
export class AuthModule {}
```

#### Step 5: Update JwtAuthGuard (Use Public Key)

```typescript
// src/shared/guard/JwtAuthGuard.ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  try {
    // JwtService automatically uses publicKey from config for verification
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      issuer: this.configService.get<string>('JWT_ISSUER'),
      // No secret needed - uses publicKey from global config
    });

    request.user = {
      sub: payload.sub,
      companyId: payload.companyId,
      role: payload.role,
      permissions: payload.permissions || [],
      email: payload.email,
    };

    return true;
  } catch {
    throw new UnauthorizedException('Invalid or expired token');
  }
}
```

#### Step 6: Update AuthService Token Generation

```typescript
// src/auth/service/AuthService.ts
private async generateTokensForUser(user: User, audience?: string) {
  const { issuer } = this.getJwtConfig();
  const kid = randomUUID();

  const claims = {
    sub: user.id,
    companyId: user.companyId,  // Multi-tenant context
    role: user.role,
    permissions: user.permissions,
    email: user.email,
  };

  // JwtService automatically uses privateKey from global config
  const accessToken = await this.jwtService.signAsync(claims, {
    issuer,
    audience,
    keyid: kid,
    expiresIn: this.accessTokenExpiry,
    // algorithm: 'RS256' already set in global config
  });

  const refreshClaims = {
    ...claims,
    jti: kid,
  };

  const refreshToken = await this.jwtService.signAsync(refreshClaims, {
    issuer,
    audience,
    keyid: kid,
    expiresIn: this.refreshTokenExpiry,
  });

  return { accessToken, refreshToken, kid };
}

private getJwtConfig() {
  return {
    issuer: this.configService.get<string>('JWT_ISSUER'),
    // No secret field needed anymore
  };
}
```

#### Step 7: Update EnvironmentVariables.ts

```typescript
// src/config/EnvironmentVariables.ts
export class EnvironmentVariables {
  // ... existing fields

  // JWT Configuration (RSA-based)
  @IsNotEmpty()
  @IsString()
  JWT_PRIVATE_KEY: string;

  @IsNotEmpty()
  @IsString()
  JWT_PUBLIC_KEY: string;

  @IsNotEmpty()
  @IsString()
  JWT_ISSUER: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRY?: string;
}
```

**Migration Checklist**:
- [ ] Generate RSA key pair for each environment (local, dev, sandbox, prod)
- [ ] Update environment files with base64-encoded keys
- [ ] Move JwtModule to AppModule with RSA configuration
- [ ] Remove JwtModule from AuthModule
- [ ] Update JwtAuthGuard to remove secret parameter
- [ ] Update AuthService token generation
- [ ] Update EnvironmentVariables validation
- [ ] Test token generation and verification
- [ ] Update documentation

**Backward Compatibility**: None - requires full migration. Plan deployment carefully.

---

## 2. Guard Strategy Analysis

### Current State (umbrella-backend)

```typescript
// Multi-tenant business app with comprehensive guards
@Controller('products')
@UseGuards(JwtAuthGuard, CompanyContextGuard, RolesGuard, PermissionsGuard)
export class ProductController {
  @Get()
  @Permissions('products:read')
  async findAll(@CompanyContext() companyId: string) { ... }
}
```

**Active Guards**:
1. **JwtAuthGuard**: Validates JWT token, extracts user
2. **CompanyContextGuard**: Extracts companyId from user, enforces tenant isolation
3. **RolesGuard**: Validates user role (admin, manager, user)
4. **PermissionsGuard**: Validates granular permissions (products:read, products:write, etc.)

### Wallet-Service Pattern

```typescript
// Financial services app with NO endpoint-level JWT guards
@Controller('transactions')
export class TransactionController {
  @Post()
  async create(@Body() dto: CreateTransactionDto) { ... }
}
```

**Guards Used**:
- **GeolocationGuard**: Regulatory compliance for financial transactions (Mexico-only restriction)
- **NO JwtAuthGuard**: Endpoints are unauthenticated

### **RECOMMENDATION 2: KEEP Umbrella-Backend Guards (NO Change)**

**Priority**: CRITICAL (Business Logic Requirement)

**Rationale**:
1. **Different Business Models**:
   - **umbrella-backend**: Multi-tenant SaaS with strict data isolation
   - **wallet-service**: Single-tenant financial service with geolocation restrictions

2. **Security Requirements**:
   - **umbrella-backend**: Must prevent cross-company data access
   - **wallet-service**: Uses application-level security (likely via API gateway)

3. **RBAC Necessity**:
   - **umbrella-backend**: Different user roles per company require permission checks
   - **wallet-service**: Likely has simpler permission model

**Decision**: **DO NOT adopt wallet-service's unauthenticated endpoint pattern**

**Why wallet-service has no JWT guards**:
- Likely uses external API gateway for authentication (e.g., Kong, AWS API Gateway)
- Application receives pre-authenticated requests with user context
- Different security architecture pattern

**Umbrella-backend MUST maintain**:
- Endpoint-level JWT authentication
- Multi-tenant isolation via CompanyContextGuard
- Role-based access control
- Granular permissions

**Optional Enhancement**: Add GeolocationGuard for regulatory compliance if umbrella-backend expands internationally.

---

## 3. GeolocationService Pattern

### Wallet-Service Pattern

```typescript
// GeolocationService - Validates requests originate from Mexico
@Injectable()
export class GeolocationService {
  async validateGeolocation(ip: string): Promise<boolean> {
    const geoData = await this.lookupIp(ip);
    return geoData.country === 'MX'; // Mexico only
  }
}

// GeolocationGuard - Blocks non-Mexico requests
@Injectable()
export class GeolocationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for'];
    const isValid = await this.geolocationService.validateGeolocation(ip);
    if (!isValid) throw new ForbiddenException('Geographic restriction');
    return true;
  }
}
```

### **RECOMMENDATION 3: Defer GeolocationService (Low Priority)**

**Priority**: LOW (No Current Requirement)

**Rationale**:
1. **No Regulatory Requirement**: Umbrella-backend is a business management tool, not a financial service
2. **Global Target Market**: Business management software typically has no geographic restrictions
3. **Implementation Complexity**: Requires IP geolocation API (e.g., MaxMind, ipapi.co)
4. **Cost**: Geolocation APIs add operational costs

**When to Implement**:
- User explicitly requests geographic restrictions
- Compliance requirements emerge (e.g., GDPR data residency)
- Product pivots to serve regulated industries

**Implementation Notes** (if needed):
- Use MaxMind GeoLite2 database (free tier available)
- Create `src/shared/service/GeolocationService.ts`
- Create `src/shared/guard/GeolocationGuard.ts`
- Add to `SharedModule` exports

**Decision**: **DO NOT implement GeolocationService now** - Add to backlog for future consideration.

---

## 4. S3Service Integration

### Wallet-Service Pattern

```typescript
// src/shared/service/S3Service.ts
@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: configService.get('AWS_REGION_NAME'),
      credentials: {
        accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async getPresignedUploadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.configService.get('AWS_BUCKET_NAME'),
      Key: key,
      // ... S3 parameters
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.configService.get('AWS_BUCKET_NAME'),
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
```

### Current State (umbrella-backend)

**Environment Variables Already Configured**:
```env
AWS_BUCKET_NAME=document-service.development
AWS_REGION_NAME=us-west-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key-here
S3_EXPIRES_TIMEOUT=3600
DOCUMENT_PROVIDER_NAME=S3
```

**Status**: Infrastructure ready, S3Service not implemented yet.

### **RECOMMENDATION 4: Adopt Wallet-Service S3Service Pattern Directly**

**Priority**: HIGH (Required for Installation Photos Module)

**Rationale**:
1. **Proven Pattern**: wallet-service implementation is production-tested
2. **Environment Variables Match**: umbrella-backend already has AWS credentials configured
3. **Business Requirement**: Installation module needs photo upload capability
4. **Presigned URLs**: Secure, scalable, cost-effective for client-side uploads

**Implementation Plan**:

#### Step 1: Install AWS SDK

```bash
yarn add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### Step 2: Create S3Service

```typescript
// src/shared/service/S3Service.ts
// ABOUTME: Manages AWS S3 file storage operations with presigned URLs.
// ABOUTME: Provides secure upload and download capabilities for document management.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EnvironmentVariables } from '../../config/EnvironmentVariables';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucketName: string;
  private defaultExpiry: number;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    const region = this.configService.get('AWS_REGION_NAME', { infer: true });
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY', { infer: true });

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('AWS S3 credentials not configured');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucketName = this.configService.get('AWS_BUCKET_NAME', { infer: true }) || '';
    this.defaultExpiry = parseInt(
      this.configService.get('S3_EXPIRES_TIMEOUT', { infer: true }) || '3600',
      10,
    );

    this.logger.log(`S3Service initialized - Bucket: ${this.bucketName}, Region: ${region}`);
  }

  /**
   * Generate presigned URL for uploading a file to S3
   * @param key - S3 object key (path/filename)
   * @param expiresIn - URL expiration in seconds (default: 3600)
   * @param contentType - MIME type of the file
   * @returns Presigned upload URL
   */
  async getPresignedUploadUrl(
    key: string,
    expiresIn?: number,
    contentType?: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || this.defaultExpiry,
    });

    this.logger.debug(`Generated upload URL for key: ${key}`);
    return url;
  }

  /**
   * Generate presigned URL for downloading a file from S3
   * @param key - S3 object key (path/filename)
   * @param expiresIn - URL expiration in seconds (default: 3600)
   * @returns Presigned download URL
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn?: number,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || this.defaultExpiry,
    });

    this.logger.debug(`Generated download URL for key: ${key}`);
    return url;
  }

  /**
   * Generate S3 object key for a file
   * @param companyId - Company ID for multi-tenant isolation
   * @param folder - Subfolder (e.g., 'installations', 'products')
   * @param filename - Original filename
   * @returns S3 object key in format: {companyId}/{folder}/{uuid}-{filename}
   */
  generateObjectKey(companyId: string, folder: string, filename: string): string {
    const uuid = require('crypto').randomUUID();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${companyId}/${folder}/${uuid}-${sanitizedFilename}`;
  }
}
```

#### Step 3: Export S3Service from SharedModule

```typescript
// src/shared/SharedModule.ts
import { Module } from '@nestjs/common';
import { S3Service } from './service/S3Service';

@Module({
  providers: [S3Service],
  exports: [S3Service],
})
export class SharedModule {}
```

#### Step 4: Create FileUpload Module (Following Umbrella-Backend Pattern)

```typescript
// src/file-upload/FileUploadModule.ts
import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/SharedModule';
import { FileUploadController } from './controller/FileUploadController';
import { FileUploadService } from './service/FileUploadService';

@Module({
  imports: [SharedModule],
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
```

```typescript
// src/file-upload/service/FileUploadService.ts
import { Injectable } from '@nestjs/common';
import { S3Service } from '../../shared/service/S3Service';

@Injectable()
export class FileUploadService {
  constructor(private readonly s3Service: S3Service) {}

  async getUploadUrl(
    companyId: string,
    folder: string,
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const key = this.s3Service.generateObjectKey(companyId, folder, filename);
    const uploadUrl = await this.s3Service.getPresignedUploadUrl(key, 300, contentType); // 5 min expiry
    return { uploadUrl, key };
  }

  async getDownloadUrl(key: string): Promise<string> {
    return this.s3Service.getPresignedDownloadUrl(key, 3600); // 1 hour expiry
  }
}
```

```typescript
// src/file-upload/controller/FileUploadController.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileUploadService } from '../service/FileUploadService';
import { JwtAuthGuard } from '../../shared/guard/JwtAuthGuard';
import { CompanyContextGuard } from '../../shared/guard/CompanyContextGuard';
import { CompanyContext } from '../../shared/decorator/CompanyContext';

@Controller('files')
@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyContextGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Get presigned upload URL for S3' })
  async getUploadUrl(
    @CompanyContext() companyId: string,
    @Body() dto: { folder: string; filename: string; contentType: string },
  ) {
    return this.fileUploadService.getUploadUrl(
      companyId,
      dto.folder,
      dto.filename,
      dto.contentType,
    );
  }

  @Get('download-url')
  @ApiOperation({ summary: 'Get presigned download URL for S3' })
  async getDownloadUrl(@Query('key') key: string) {
    const url = await this.fileUploadService.getDownloadUrl(key);
    return { downloadUrl: url };
  }
}
```

#### Step 5: Update EnvironmentVariables.ts

```typescript
// src/config/EnvironmentVariables.ts
export class EnvironmentVariables {
  // ... existing fields

  // AWS S3 Configuration
  @IsNotEmpty()
  @IsString()
  AWS_BUCKET_NAME: string;

  @IsNotEmpty()
  @IsString()
  AWS_REGION_NAME: string;

  @IsNotEmpty()
  @IsString()
  AWS_ACCESS_KEY_ID: string;

  @IsNotEmpty()
  @IsString()
  AWS_SECRET_ACCESS_KEY: string;

  @IsOptional()
  @IsString()
  S3_EXPIRES_TIMEOUT?: string;
}
```

#### Step 6: Register FileUploadModule in AppModule

```typescript
// src/AppModule.ts
import { FileUploadModule } from './file-upload/FileUploadModule';

@Module({
  imports: [
    // ... existing imports
    FileUploadModule,
  ],
})
export class AppModule {}
```

**Implementation Checklist**:
- [ ] Install AWS SDK dependencies
- [ ] Create S3Service in shared module
- [ ] Export S3Service from SharedModule
- [ ] Create FileUploadModule with service and controller
- [ ] Add AWS configuration to EnvironmentVariables
- [ ] Register FileUploadModule in AppModule
- [ ] Write unit tests for S3Service
- [ ] Write integration tests for FileUpload endpoints
- [ ] Update Swagger documentation
- [ ] Test with real S3 bucket

**Usage Flow** (Client → Backend → S3):
1. **Client**: Request upload URL → `POST /files/upload-url` with `{ folder, filename, contentType }`
2. **Backend**: Generate presigned URL → Return `{ uploadUrl, key }`
3. **Client**: Upload file directly to S3 using presigned URL (PUT request)
4. **Client**: Store `key` in database (e.g., InstallationPhoto entity)
5. **Client**: Request download URL → `GET /files/download-url?key={key}`
6. **Backend**: Generate presigned download URL → Return `{ downloadUrl }`

---

## 5. External Integrations Structure (libs/ Folder)

### Wallet-Service Pattern

```
wallet-service/
  src/
    libs/
      stp/                # STP banking integration
        STPModule.ts
        STPService.ts
        dto/
        interface/
```

### Current State (umbrella-backend)

```
umbrella-backend/
  src/
    sms-validation/       # Twilio SMS integration
      SmsValidationModule.ts
      SmsValidationService.ts
```

**External Integrations Needed** (from session context):
- AWS S3 (file storage)
- OneSignal (push notifications)
- Twilio (SMS validation) - already implemented

### **RECOMMENDATION 5: DO NOT Create libs/ Folder**

**Priority**: LOW (No Current Benefit)

**Rationale**:
1. **NestJS Convention**: External integrations are typically modules in `src/`, not separate `libs/` folder
2. **Monorepo Pattern**: `libs/` is common in Nx monorepos, not single-app NestJS projects
3. **Current Structure Works**: `sms-validation` module already demonstrates good pattern for external integrations
4. **Future Flexibility**: Can refactor to `libs/` if project becomes monorepo

**Recommended Structure** (Follow NestJS Conventions):

```
umbrella-backend/
  src/
    sms-validation/       # Twilio integration (existing)
    file-upload/          # AWS S3 integration (new)
    notification/         # OneSignal integration (future)
```

**Decision**: **KEEP current module-based structure** - Only create `libs/` if migrating to Nx monorepo.

**Alternative for Code Reuse**:
- If code needs to be shared across multiple NestJS apps → Create separate npm packages
- If building microservices → Use Nx workspace with `libs/` folder

---

## 6. Environment Variables Alignment

### Wallet-Service Environment Variables (Relevant to Umbrella-Backend)

```env
# JWT Configuration (RSA-based)
JWT_PRIVATE_KEY=<base64-encoded-RSA-private-key>
JWT_PUBLIC_KEY=<base64-encoded-RSA-public-key>
JWT_ISSUER=wallet-service.production.paisamex.mx
JWT_EXPIRY=30m

# AWS S3
AWS_BUCKET_NAME=wallet-documents.production
AWS_REGION_NAME=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_EXPIRES_TIMEOUT=3600

# OneSignal
ONESIGNAL_APP_ID=...
ONESIGNAL_REST_API_KEY=...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Current Umbrella-Backend Environment Variables

```env
# JWT Configuration (SECRET-based - needs RSA migration)
JWT_SECRET=local-dev-secret-key-change-me
JWT_EXPIRY=30m
JWT_ISSUER=umbrella-backend.local.paisamex.mx
JWT_PRIVATE_KEY=local-dev-private-key  # Misnamed - actually used as secret

# AWS S3 (already configured correctly)
AWS_BUCKET_NAME=document-service.development
AWS_REGION_NAME=us-west-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key-here
S3_EXPIRES_TIMEOUT=3600
DOCUMENT_PROVIDER_NAME=S3

# OneSignal (already configured)
ONESIGNAL_APP_ID=your-onesignal-app-id-here
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key-here

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/umbrella-backend
PORT=3030

# Twilio (unique to umbrella-backend)
TWILIO_ACCOUNT_SID=your-twilio-account-sid-here
TWILIO_VERIFY_SID=your-twilio-verify-sid-here
TWILIO_AUTH_TOKEN=your-twilio-auth-token-here

# Security
SALT_ROUND=10
```

### **RECOMMENDATION 6: Update JWT Environment Variables**

**Priority**: HIGH (Part of RSA Migration)

**Changes Required**:

```env
# environment/local.env (AFTER RSA migration)

# JWT Configuration (RSA-based)
JWT_PRIVATE_KEY=<base64-encoded-RSA-private-key>
JWT_PUBLIC_KEY=<base64-encoded-RSA-public-key>
JWT_ISSUER=umbrella-backend.local.paisamex.mx
JWT_EXPIRY=30m

# Remove these (deprecated):
# JWT_SECRET=...

# AWS S3 (no changes - already correct)
AWS_BUCKET_NAME=document-service.development
AWS_REGION_NAME=us-west-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key-here
S3_EXPIRES_TIMEOUT=3600

# OneSignal (no changes)
ONESIGNAL_APP_ID=your-onesignal-app-id-here
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key-here

# Database (no changes)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/umbrella-backend
PORT=3030

# Twilio (umbrella-backend specific)
TWILIO_ACCOUNT_SID=your-twilio-account-sid-here
TWILIO_VERIFY_SID=your-twilio-verify-sid-here
TWILIO_AUTH_TOKEN=your-twilio-auth-token-here

# Security
SALT_ROUND=10
```

**Alignment Summary**:
- ✅ AWS S3 variables already match wallet-service pattern
- ✅ OneSignal variables already configured
- ⚠️ JWT variables need RSA migration (Recommendation 1)
- ✅ Database configuration follows same pattern
- ℹ️ Twilio is umbrella-backend specific (not in wallet-service)

---

## 7. Module Structure Comparison

### Wallet-Service Module Structure

```
wallet-service/
  src/
    app.module.ts             # JwtModule global here
    auth/                     # No JwtModule import
      AuthModule.ts
      service/AuthService.ts
    shared/
      service/
        S3Service.ts          # File storage
        GeolocationService.ts # Regulatory compliance
      guard/
        GeolocationGuard.ts
    libs/
      stp/                    # External banking integration
```

### Umbrella-Backend Module Structure

```
umbrella-backend/
  src/
    AppModule.ts              # Will have JwtModule global (after migration)
    auth/
      AuthModule.ts           # Will remove JwtModule (after migration)
      service/AuthService.ts
    shared/
      decorator/              # Custom decorators (CompanyContext, Permissions, etc.)
      guard/                  # Guards (JwtAuth, CompanyContext, Roles, Permissions)
      service/                # Will add S3Service
      error/                  # Custom error classes
    company/                  # Multi-tenant company management
    product/                  # Product catalog
    [other business modules]
    sms-validation/           # External Twilio integration
```

### **RECOMMENDATION 7: Minor Structural Alignment**

**Changes**:
1. ✅ Move JwtModule to AppModule (Recommendation 1)
2. ✅ Add S3Service to shared/service/ (Recommendation 4)
3. ❌ Do NOT create libs/ folder (Recommendation 5)
4. ❌ Do NOT add GeolocationGuard (Recommendation 3)

**Result**: Umbrella-backend maintains NestJS conventions while adopting wallet-service's JWT and S3 patterns.

---

## 8. Summary of Recommendations

| Recommendation | Priority | Action | Rationale |
|----------------|----------|--------|-----------|
| **1. RSA-Based JWT + Global Module** | **HIGH** | **ADOPT** | Security, scalability, industry best practice |
| **2. Keep Multi-Tenant Guards** | **CRITICAL** | **NO CHANGE** | Business requirement - different from wallet-service |
| **3. GeolocationService** | **LOW** | **DEFER** | No current regulatory requirement |
| **4. S3Service** | **HIGH** | **ADOPT** | Required for installation photos, proven pattern |
| **5. libs/ Folder Structure** | **LOW** | **REJECT** | Not needed for single-app NestJS project |
| **6. JWT Environment Variables** | **HIGH** | **UPDATE** | Part of RSA migration |
| **7. Module Structure** | **MEDIUM** | **MINOR CHANGES** | Adopt JWT/S3 patterns, keep multi-tenant structure |

---

## 9. Implementation Roadmap

### Phase 1: JWT RSA Migration (Week 1)
**Goal**: Migrate from secret-based to RSA-based JWT authentication

**Tasks**:
1. Generate RSA key pairs for all environments
2. Update environment files with base64-encoded keys
3. Move JwtModule to AppModule with RSA configuration
4. Remove JwtModule from AuthModule
5. Update JwtAuthGuard to use public key
6. Update AuthService token generation
7. Update EnvironmentVariables validation
8. Write migration guide for team
9. Test token generation and verification
10. Deploy to development environment
11. Monitor for issues before production

**Deliverables**:
- RSA key pairs for all environments
- Updated AppModule with global JwtModule
- Updated AuthModule (JwtModule removed)
- Updated JwtAuthGuard
- Updated AuthService
- Migration documentation

**Testing**:
- Unit tests for token generation
- Integration tests for authentication flow
- Verify backward incompatibility (tokens generated before migration won't work)

---

### Phase 2: S3Service Integration (Week 2)
**Goal**: Implement file upload/download using AWS S3 with presigned URLs

**Tasks**:
1. Install AWS SDK dependencies
2. Create S3Service in shared/service/
3. Export S3Service from SharedModule
4. Create FileUploadModule with service and controller
5. Add AWS configuration validation to EnvironmentVariables
6. Register FileUploadModule in AppModule
7. Write DTOs for upload/download requests
8. Implement presigned URL generation
9. Test with real S3 bucket
10. Write unit tests for S3Service
11. Write integration tests for FileUpload endpoints
12. Update Swagger documentation
13. Create client integration guide (how to upload files)

**Deliverables**:
- S3Service with presigned URL methods
- FileUploadModule with endpoints
- Unit and integration tests
- Swagger documentation
- Client integration guide

**Testing**:
- Unit tests for S3Service methods
- Integration tests for upload/download flow
- Manual testing with frontend client

---

### Phase 3: Installation Photos Module (Week 3)
**Goal**: Implement installation photos using S3Service

**Tasks**:
1. Create InstallationPhoto entity with S3 key field
2. Update Installation entity with photos relationship
3. Create DTOs for photo operations
4. Implement photo upload workflow in InstallationService
5. Add photo endpoints to InstallationController
6. Generate and run database migration
7. Write unit tests
8. Write integration tests
9. Update Swagger documentation

**Deliverables**:
- InstallationPhoto entity
- Photo upload/download workflow
- Database migration
- Tests and documentation

---

### Phase 4: Optional Enhancements (Future)
**Goal**: Consider future improvements based on product roadmap

**Deferred Items**:
1. GeolocationService - Only if regulatory compliance needed
2. libs/ folder structure - Only if migrating to Nx monorepo
3. OneSignal push notifications - Implement when mobile app requires notifications

---

## 10. Migration Risks and Mitigation

### Risk 1: JWT Migration Breaking Active Sessions

**Risk Level**: HIGH

**Impact**: All active user sessions will be invalidated when switching from secret to RSA

**Mitigation**:
1. **Communication**: Notify users of planned maintenance window
2. **Deployment Strategy**: Deploy during low-traffic hours
3. **Graceful Degradation**: Consider temporary dual-token support (accept both old secret-based and new RSA-based tokens during transition period)
4. **Monitoring**: Track authentication failure rates post-deployment
5. **Rollback Plan**: Keep old JWT_SECRET in environment for emergency rollback

**Implementation** (Optional Dual-Token Support):
```typescript
// Temporary: Support both old secret and new RSA during migration
try {
  // Try new RSA verification first
  payload = await this.jwtService.verifyAsync(token, { /* RSA config */ });
} catch {
  // Fall back to old secret verification
  try {
    payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_SECRET_LEGACY')
    });
    this.logger.warn('User authenticated with legacy token - needs re-login');
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}
```

### Risk 2: S3 Integration Costs

**Risk Level**: MEDIUM

**Impact**: AWS S3 storage and bandwidth costs may increase with photo uploads

**Mitigation**:
1. **Cost Estimation**: Calculate estimated costs based on expected upload volume
2. **File Size Limits**: Implement maximum file size restrictions (e.g., 5MB per photo)
3. **Lifecycle Policies**: Configure S3 lifecycle rules to archive/delete old photos
4. **Monitoring**: Set up AWS cost alerts
5. **Alternative**: Implement local filesystem storage for development/low-volume deployments

### Risk 3: Environment Variable Conflicts

**Risk Level**: LOW

**Impact**: JWT_PRIVATE_KEY currently used as secret, will be overwritten with RSA key

**Mitigation**:
1. **Clear Naming**: Use JWT_SECRET_LEGACY for old secret during migration
2. **Validation**: Add startup checks to ensure RSA keys are properly formatted
3. **Documentation**: Update environment setup guide with new variable requirements

---

## 11. Testing Strategy

### JWT Migration Tests

```typescript
// src/auth/service/AuthService.spec.ts
describe('AuthService - RSA JWT', () => {
  it('should generate tokens with RS256 algorithm', async () => {
    const tokens = await authService.generateTokensForUser(mockUser);
    const decoded = jwt.decode(tokens.accessToken, { complete: true });
    expect(decoded.header.alg).toBe('RS256');
  });

  it('should verify token with public key', async () => {
    const token = await authService.generateTokensForUser(mockUser);
    const payload = await jwtService.verifyAsync(token.accessToken);
    expect(payload.sub).toBe(mockUser.id);
  });

  it('should include multi-tenant context in JWT payload', async () => {
    const tokens = await authService.generateTokensForUser(mockUser);
    const payload = jwt.decode(tokens.accessToken) as JwtPayload;
    expect(payload.companyId).toBe(mockUser.companyId);
    expect(payload.role).toBe(mockUser.role);
    expect(payload.permissions).toEqual(mockUser.permissions);
  });
});
```

### S3Service Tests

```typescript
// src/shared/service/S3Service.spec.ts
describe('S3Service', () => {
  it('should generate valid presigned upload URL', async () => {
    const url = await s3Service.getPresignedUploadUrl('test-key');
    expect(url).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
    expect(url).toContain('X-Amz-Credential');
  });

  it('should generate object key with company isolation', () => {
    const key = s3Service.generateObjectKey('company-123', 'photos', 'test.jpg');
    expect(key).toMatch(/^company-123\/photos\/[0-9a-f-]+\-test\.jpg$/);
  });

  it('should handle file upload workflow', async () => {
    const { uploadUrl, key } = await fileUploadService.getUploadUrl(
      'company-123',
      'installations',
      'photo.jpg',
      'image/jpeg',
    );
    expect(uploadUrl).toBeDefined();
    expect(key).toContain('company-123/installations');
  });
});
```

---

## 12. Documentation Requirements

### Updated Documentation Needed

1. **Environment Setup Guide**:
   - RSA key generation instructions
   - Updated environment variable reference
   - AWS S3 bucket setup guide

2. **Authentication Flow Documentation**:
   - JWT token structure (RSA-based)
   - Token refresh workflow
   - Multi-tenant token claims

3. **File Upload Integration Guide**:
   - Presigned URL workflow
   - Client-side upload implementation
   - S3 key naming conventions

4. **API Documentation**:
   - Update Swagger with new endpoints
   - File upload/download examples
   - Authentication header requirements

---

## 13. Final Recommendations

### Adopt from Wallet-Service ✅

1. **RSA-Based JWT Authentication**:
   - Move JwtModule to AppModule as global module
   - Use RSA key pairs instead of shared secret
   - Update environment variables

2. **S3Service Pattern**:
   - Copy wallet-service S3Service implementation
   - Use presigned URLs for file uploads
   - Implement in FileUploadModule

3. **Environment Variable Naming**:
   - Align JWT variable names with wallet-service
   - Keep AWS S3 configuration consistent

### Keep Umbrella-Backend Specific ⚠️

1. **Multi-Tenant Guards**:
   - JwtAuthGuard (required for authentication)
   - CompanyContextGuard (required for tenant isolation)
   - RolesGuard (required for RBAC)
   - PermissionsGuard (required for granular access control)

2. **Module Structure**:
   - Keep modules in src/ (not libs/)
   - Maintain business module organization
   - Follow NestJS conventions

3. **Business Logic**:
   - Company-based data isolation
   - Permission system
   - Multi-tenant architecture patterns

### Defer for Future 🔮

1. **GeolocationService**:
   - No current regulatory requirement
   - Add if geographic restrictions needed
   - Monitor compliance requirements

2. **libs/ Folder Structure**:
   - Only needed for monorepo setup
   - Current module structure sufficient
   - Revisit if migrating to Nx workspace

---

## Conclusion

David, the alignment strategy is **selective adoption** - take what enhances security and scalability (RSA JWT, S3Service) while preserving umbrella-backend's unique multi-tenant architecture and business logic requirements.

The most critical recommendation is migrating to RSA-based JWT authentication with global JwtModule in AppModule, which provides production-grade security and aligns with wallet-service's proven pattern. The S3Service implementation is straightforward to adopt since your environment variables are already configured.

Your instinct to keep the multi-tenant guards is absolutely correct - wallet-service operates in a different security context (likely API gateway authentication) while umbrella-backend requires endpoint-level multi-tenant isolation.

Next steps:
1. Review this analysis
2. Prioritize which recommendations to implement first
3. Begin with RSA JWT migration (highest security impact)
4. Follow with S3Service integration (required for installation photos)
5. Keep GeolocationService on backlog for future consideration

Would you like me to create detailed implementation plans for the RSA JWT migration or S3Service integration?
