import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
import { getWriteDatabaseConfig } from './config/database-write.config';
import { getReadDatabaseConfig } from './config/database-read.config';
import { UsersModule } from './users/users.module';
import { ProjectionSyncService } from './shared/infrastructure/projections/projection-sync.service';

/**
 * AppModule - Configuración Principal con CQRS
 * 
 * Implementa CQRS con bases de datos físicamente separadas:
 * 
 * 1. Write Database (users_write):
 *    - Estado actual (users)
 *    - Event Store (domain_events)
 *    - Optimizada para escrituras transaccionales
 * 
 * 2. Read Database (users_read):
 *    - Proyecciones (user)
 *    - Vistas materializadas
 *    - Optimizada para consultas complejas
 * 
 * La sincronización entre ambas se maneja mediante:
 * - ProjectionSyncService (automático)
 * - Event-driven updates
 * - Periodic catch-up
 */
@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Módulo de scheduling para sincronización periódica
    ScheduleModule.forRoot(),

    // CQRS Module para EventBus
    CqrsModule,

    // Write Database (Command Side - CQRS)
    TypeOrmModule.forRootAsync({
      name: 'write',
      imports: [ConfigModule],
      useFactory: getWriteDatabaseConfig,
      inject: [ConfigService],
    }),

    // Read Database (Query Side - CQRS)
    TypeOrmModule.forRootAsync({
      name: 'read',
      imports: [ConfigModule],
      useFactory: getReadDatabaseConfig,
      inject: [ConfigService],
    }),

    // Users Module - Contiene los @MessagePattern para Kafka
    UsersModule,
  ],
  providers: [
    ProjectionSyncService,
  ],
})
export class AppModule {}
