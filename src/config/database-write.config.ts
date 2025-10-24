import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../shared/user.entity';
import { DomainEventEntity } from '../shared/infrastructure/entities/domain-event.entity';

/**
 * Write Database Configuration (CQRS - Command Side)
 * 
 * Esta base de datos almacena:
 * - Estado actual (users table)
 * - Event Store (domain_events table)
 * - Datos de escritura normalizados
 * 
 * Optimizada para:
 * - Escrituras transaccionales
 * - Consistencia fuerte (ACID)
 * - Integridad referencial
 */
export const getWriteDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    name: 'write', // Named connection
    type: 'postgres',
    host: configService.get<string>('DB_WRITE_HOST'),
    port: configService.get<number>('DB_WRITE_PORT'),
    username: configService.get<string>('DB_WRITE_USERNAME'),
    password: configService.get<string>('DB_WRITE_PASSWORD'),
    database: configService.get<string>('DB_WRITE_NAME'),
    
    // Entities para la base de datos de escritura
    entities: [
      UserEntity,
      DomainEventEntity
    ],
    
    // Migración única maestra
    migrations: ['dist/migrations/1759100000000-InitializeUsersDatabases.js'],
    migrationsTableName: 'migrations',
    migrationsRun: configService.get<boolean>('DB_MIGRATIONS_RUN', false),
    
    // Configuración
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
    logging: configService.get<boolean>('DB_LOGGING', false),
    
    // Pool de conexiones optimizado para escritura
    extra: {
      max: 20, // Menor pool para escrituras
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    
    // SSL en producción
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : false,
  };
};

