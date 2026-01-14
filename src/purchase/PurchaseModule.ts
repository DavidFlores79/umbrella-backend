// ABOUTME: NestJS module for Purchase entity with controller, service, and TypeORM integration.
// ABOUTME: Provides purchase order management with line items and multi-tenant isolation.

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PurchaseController } from './controller/PurchaseController';
import { PurchaseService } from './service/PurchaseService';
import { Purchase } from './entity/Purchase';
import { PurchaseLineItem } from './entity/PurchaseLineItem';
import { EnvironmentVariables } from '../config/EnvironmentVariables';
import { CompanyModule } from '../company/CompanyModule';

@Module({
  imports: [
    TypeOrmModule.forFeature([Purchase, PurchaseLineItem]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        secret:
          configService.get('JWT_SECRET', { infer: true }) ||
          'default-secret-key',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRY', { infer: true }) || '30m',
        },
      }),
      inject: [ConfigService],
    }),
    CompanyModule,
  ],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
