import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserProjectionEntity } from '../shared/infrastructure/entities/user-projection.entity';

/**
 * Read Database Configuration (CQRS - Query Side)
 * 
 * Esta base de datos almacena:
 * - Proyecciones optimizadas (user)
 * - Datos denormalizados para consultas rápidas
 * - Vistas materializadas
 * 
 * Optimizada para:
 * - Lecturas masivas
 * - Queries complejas
 * - Índices especializados
 * - Full-text search
 * - Agregaciones
 */
export const getReadDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    name: 'read', // Named connection
    type: 'postgres',
    host: configService.get<string>('DB_READ_HOST'),
    port: configService.get<number>('DB_READ_PORT'),
    username: configService.get<string>('DB_READ_USERNAME'),
    password: configService.get<string>('DB_READ_PASSWORD'),
    database: configService.get<string>('DB_READ_NAME'),
    
    // Entities para la base de datos de lectura (solo proyecciones)
    entities: [
      UserProjectionEntity,
    ],
    
    // Migración única maestra
    migrations: ['dist/migrations/1759100000000-InitializeUsersDatabases.js'],
    migrationsTableName: 'migrations',
    migrationsRun: configService.get<boolean>('DB_MIGRATIONS_RUN', false),
    
    // Configuración
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
    logging: configService.get<boolean>('DB_LOGGING', false),
    
    // Pool de conexiones optimizado para lectura
    extra: {
      max: 50, // Mayor pool para lecturas
      min: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      // Read replica optimizations
      statement_timeout: 30000, // 30 segundos timeout para queries
    },
    
    // SSL en producción
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : false,
  };
};

