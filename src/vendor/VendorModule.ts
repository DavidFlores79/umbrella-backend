// ABOUTME: NestJS module for Vendor entity with controller, service, and TypeORM integration.
// ABOUTME: Provides vendor (supplier) management with multi-tenant isolation.

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VendorController } from './controller/VendorController';
import { VendorService } from './service/VendorService';
import { Vendor } from './entity/Vendor';
import { EnvironmentVariables } from '../config/EnvironmentVariables';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor]),
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
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}
