// ABOUTME: NestJS module for Company entity with controller, service, and TypeORM integration.
// ABOUTME: Provides multi-tenant company management functionality.

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CompanyController } from './controller/CompanyController';
import { CompanyService } from './service/CompanyService';
import { Company } from './entity/Company';
import { EnvironmentVariables } from '../config/EnvironmentVariables';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
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
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
