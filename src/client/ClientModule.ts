// ABOUTME: NestJS module for Client entity with controller, service, and TypeORM integration.
// ABOUTME: Provides client (customer) management with multi-tenant isolation.

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClientController } from './controller/ClientController';
import { ClientService } from './service/ClientService';
import { Client } from './entity/Client';
import { EnvironmentVariables } from '../config/EnvironmentVariables';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client]),
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
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
