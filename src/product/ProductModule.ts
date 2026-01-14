// ABOUTME: NestJS module for Product entity with controller, service, and TypeORM integration.
// ABOUTME: Provides product catalog management with multi-tenant isolation.

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProductController } from './controller/ProductController';
import { ProductService } from './service/ProductService';
import { Product } from './entity/Product';
import { EnvironmentVariables } from '../config/EnvironmentVariables';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
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
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
