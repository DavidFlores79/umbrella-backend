// ABOUTME: NestJS module for Sale entity with controller, service, and TypeORM integration.
// ABOUTME: Provides sales management with line items and multi-tenant isolation.

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SaleController } from './controller/SaleController';
import { SaleService } from './service/SaleService';
import { Sale } from './entity/Sale';
import { SaleLineItem } from './entity/SaleLineItem';
import { EnvironmentVariables } from '../config/EnvironmentVariables';
import { CompanyModule } from '../company/CompanyModule';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleLineItem]),
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
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
