import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * InitializeUsersDatabases - Migración Maestra Única
 * 
 * Prerequisitos:
 * - Las bases de datos users_write y users_read deben existir previamente
 * - Las extensiones necesarias (uuid-ossp, pg_trgm) deben estar disponibles
 * 
 * Esta migración:
 * - Detecta automáticamente en qué BD se ejecuta (write/read)
 * - Crea las tablas necesarias para cada BD
 * - Limpia elementos obsoletos si existen
 * - Es idempotente (se puede ejecutar múltiples veces)
 * 
 * Write DB (users_write):
 *   - users (12 campos: id, email, first_name, last_name, password, status, phone, 
 *            role_id, created_at, updated_at, last_login_at, deleted_at)
 *   - domain_events (9 campos - Event Store)
 * 
 * Read DB (users_read):
 *   - users (13 campos - CQRS: id, email, full_name, status, phone, last_login_at,
 *            failed_login_attempts, roles, permissions, profile_completion, 
 *            created_at, updated_at, deleted_at)
 *   - domain_events (9 campos - Event Store Copy)
 */
export class InitializeUsersDatabases1759100000000 implements MigrationInterface {
  name = 'InitializeUsersDatabases1759100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Usar el nombre de la conexión (write/read) en lugar del nombre de la BD
    const connectionName = queryRunner.connection.options.name || 'default';
    const dbName = queryRunner.connection.options.database as string || connectionName;
    const isWriteDb = connectionName === 'write' || (dbName && dbName.includes('write'));
    const isReadDb = connectionName === 'read' || (dbName && dbName.includes('read'));

    console.log(`\n🚀 Initializing tables in connection: ${connectionName} (${dbName})...`);

    // Habilitar extensiones necesarias
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    console.log('✅ UUID extension enabled');

    // Crear tablas según la conexión
    if (isWriteDb) {
      console.log('📝 Detected WRITE database');
      await this.createWriteTables(queryRunner);
      await this.cleanWriteObsoletes(queryRunner);
    } else if (isReadDb) {
      console.log('📖 Detected READ database');
      await this.createReadTables(queryRunner);
      await this.cleanReadObsoletes(queryRunner);
    } else {
      console.warn(`⚠️  Unknown connection type: ${connectionName}. Expected "write" or "read".`);
      throw new Error(`Migration requires connection name to be "write" or "read", got: ${connectionName}`);
    }

    console.log(`✅ Tables initialized successfully in ${connectionName}!\n`);
  }

  /**
   * Crear tablas para Write Database (Command Side)
   */
  private async createWriteTables(queryRunner: QueryRunner): Promise<void> {
    console.log('\n📝 Creating WRITE tables...');

    // ============================================
    // TABLA: users
    // ============================================
    const hasUsers = await queryRunner.hasTable('users');
    if (!hasUsers) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
              comment: 'Primary key - User ID',
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isUnique: true,
              isNullable: false,
              comment: 'User email address',
            },
            {
              name: 'first_name',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'User first name',
            },
            {
              name: 'last_name',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'User last name',
            },
            {
              name: 'password',
              type: 'varchar',
              length: '255',
              isNullable: false,
              comment: 'Hashed password',
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              isNullable: false,
              default: "'PENDING_VERIFICATION'",
              comment: 'User account status',
            },
            {
              name: 'phone',
              type: 'varchar',
              length: '20',
              isNullable: true,
              comment: 'User phone number',
            },
            {
              name: 'role_id',
              type: 'uuid',
              isNullable: true,
              comment: 'User role reference',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'last_login_at',
              type: 'timestamp',
              isNullable: true,
              comment: 'Last successful login timestamp',
            },
            {
              name: 'deleted_at',
              type: 'timestamp',
              isNullable: true,
              comment: 'Soft delete timestamp',
            },
          ],
        }),
        true,
      );

      // Índices para users
      await queryRunner.query(`
        CREATE INDEX "IDX_USERS_EMAIL" ON "users" ("email");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_USERS_STATUS" ON "users" ("status");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_USERS_CREATED_AT" ON "users" ("created_at");
      `);

      console.log('  ✓ Table "users" created (12 fields)');
    } else {
      console.log('  ℹ️  Table "users" already exists');
    }

    // ============================================
    // TABLA: domain_events (Event Store)
    // ============================================
    const hasDomainEvents = await queryRunner.hasTable('domain_events');
    if (!hasDomainEvents) {
      await queryRunner.createTable(
        new Table({
          name: 'domain_events',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
              comment: 'Event ID',
            },
            {
              name: 'aggregate_id',
              type: 'uuid',
              isNullable: false,
              comment: 'ID of the aggregate root (e.g., user ID)',
            },
            {
              name: 'aggregate_type',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'Type of the aggregate (e.g., User)',
            },
            {
              name: 'event_type',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'Type of domain event',
            },
            {
              name: 'event_data',
              type: 'jsonb',
              isNullable: false,
              comment: 'Complete event payload as JSON',
            },
            {
              name: 'metadata',
              type: 'jsonb',
              isNullable: true,
              comment: 'Additional metadata (user, IP, correlation ID)',
            },
            {
              name: 'version',
              type: 'int',
              isNullable: false,
              default: 1,
              comment: 'Version number for aggregate state',
            },
            {
              name: 'occurred_at',
              type: 'timestamp',
              isNullable: false,
              default: 'CURRENT_TIMESTAMP',
              comment: 'When the event occurred',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              isNullable: false,
              default: 'CURRENT_TIMESTAMP',
              comment: 'When the event was stored',
            },
          ],
        }),
        true,
      );

      // Índices optimizados para Event Store
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_AGGREGATE_ID" 
        ON "domain_events" ("aggregate_id");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_AGGREGATE_TYPE" 
        ON "domain_events" ("aggregate_type");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_EVENT_TYPE" 
        ON "domain_events" ("event_type");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_OCCURRED_AT" 
        ON "domain_events" ("occurred_at" DESC);
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_CREATED_AT" 
        ON "domain_events" ("created_at" DESC);
      `);
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_DOMAIN_EVENTS_AGGREGATE_VERSION" 
        ON "domain_events" ("aggregate_id", "version");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_EVENT_DATA" 
        ON "domain_events" USING GIN ("event_data");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_METADATA" 
        ON "domain_events" USING GIN ("metadata");
      `);

      console.log('  ✓ Table "domain_events" created (9 fields, 8 indexes)');
    } else {
      console.log('  ℹ️  Table "domain_events" already exists');
    }
  }

  /**
   * Crear tablas para Read Database (Query Side - CQRS)
   */
  private async createReadTables(queryRunner: QueryRunner): Promise<void> {
    console.log('\n📖 Creating READ tables (CQRS)...');

    // ============================================
    // TABLA: users
    // ============================================
    const hasUsers = await queryRunner.hasTable('users');
    if (!hasUsers) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              comment: 'Same as user ID from users table',
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isNullable: false,
              isUnique: true,
              comment: 'User email',
            },
            {
              name: 'full_name',
              type: 'varchar',
              length: '255',
              isNullable: false,
              comment: 'Denormalized full name for fast searching',
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              isNullable: false,
              comment: 'User status',
            },
            {
              name: 'phone',
              type: 'varchar',
              length: '20',
              isNullable: true,
              comment: 'User phone',
            },
            {
              name: 'last_login_at',
              type: 'timestamp',
              isNullable: true,
              comment: 'Last login timestamp',
            },
            {
              name: 'failed_login_attempts',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Number of consecutive failed login attempts',
            },
            {
              name: 'roles',
              type: 'jsonb',
              isNullable: true,
              comment: 'Denormalized roles array',
            },
            {
              name: 'permissions',
              type: 'jsonb',
              isNullable: true,
              comment: 'Flattened permissions array',
            },
            {
              name: 'profile_completion',
              type: 'int',
              default: 0,
              isNullable: false,
              comment: 'Profile completion percentage (0-100)',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              isNullable: false,
              comment: 'User creation timestamp',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              isNullable: false,
              default: 'CURRENT_TIMESTAMP',
              comment: 'Last update timestamp',
            },
            {
              name: 'deleted_at',
              type: 'timestamp',
              isNullable: true,
              comment: 'Soft delete timestamp',
            },
          ],
        }),
        true,
      );

      // Índices optimizados para queries
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_USERS_READ_EMAIL" 
        ON "users" ("email");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_USERS_READ_STATUS" 
        ON "users" ("status");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_USERS_READ_CREATED_AT" 
        ON "users" ("created_at" DESC);
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_USERS_READ_LAST_LOGIN_AT" 
        ON "users" ("last_login_at" DESC NULLS LAST);
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_USERS_READ_ROLES" 
        ON "users" USING GIN ("roles");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_USERS_READ_PERMISSIONS" 
        ON "users" USING GIN ("permissions");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_USERS_READ_DELETED_AT" 
        ON "users" ("deleted_at");
      `);

      console.log('  ✓ Table "users" created (13 fields, 7 indexes)');
    } else {
      console.log('  ℹ️  Table "users" already exists');
    }

    // ============================================
    // TABLA: domain_events (Event Store - Read Copy)
    // ============================================
    const hasDomainEvents = await queryRunner.hasTable('domain_events');
    if (!hasDomainEvents) {
      await queryRunner.createTable(
        new Table({
          name: 'domain_events',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
              comment: 'Event ID',
            },
            {
              name: 'aggregate_id',
              type: 'uuid',
              isNullable: false,
              comment: 'ID of the aggregate root (e.g., user ID)',
            },
            {
              name: 'aggregate_type',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'Type of the aggregate (e.g., User)',
            },
            {
              name: 'event_type',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'Type of domain event',
            },
            {
              name: 'event_data',
              type: 'jsonb',
              isNullable: false,
              comment: 'Complete event payload as JSON',
            },
            {
              name: 'metadata',
              type: 'jsonb',
              isNullable: true,
              comment: 'Additional metadata (user, IP, correlation ID)',
            },
            {
              name: 'version',
              type: 'int',
              isNullable: false,
              default: 1,
              comment: 'Version number for aggregate state',
            },
            {
              name: 'occurred_at',
              type: 'timestamp',
              isNullable: false,
              default: 'CURRENT_TIMESTAMP',
              comment: 'When the event occurred',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              isNullable: false,
              default: 'CURRENT_TIMESTAMP',
              comment: 'When the event was stored',
            },
          ],
        }),
        true,
      );

      // Índices optimizados para Event Store (lectura)
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_READ_AGGREGATE_ID" 
        ON "domain_events" ("aggregate_id");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_READ_AGGREGATE_TYPE" 
        ON "domain_events" ("aggregate_type");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_READ_EVENT_TYPE" 
        ON "domain_events" ("event_type");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_READ_OCCURRED_AT" 
        ON "domain_events" ("occurred_at" DESC);
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_READ_CREATED_AT" 
        ON "domain_events" ("created_at" DESC);
      `);
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_DOMAIN_EVENTS_READ_AGGREGATE_VERSION" 
        ON "domain_events" ("aggregate_id", "version");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_READ_EVENT_DATA" 
        ON "domain_events" USING GIN ("event_data");
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_DOMAIN_EVENTS_READ_METADATA" 
        ON "domain_events" USING GIN ("metadata");
      `);

      console.log('  ✓ Table "domain_events" created (9 fields, 8 indexes)');
    } else {
      console.log('  ℹ️  Table "domain_events" already exists');
    }
  }

  /**
   * Limpiar elementos obsoletos en Write Database
   */
  private async cleanWriteObsoletes(queryRunner: QueryRunner): Promise<void> {
    console.log('\n🧹 Cleaning obsolete elements in WRITE database...');

    let cleanedCount = 0;

    // Limpiar enums obsoletos
    try {
      await queryRunner.query(`DROP TYPE IF EXISTS users_status_enum CASCADE;`);
      await queryRunner.query(`DROP TYPE IF EXISTS user_status_enum CASCADE;`);
      cleanedCount += 2;
    } catch (error) {
      // Ignorar si no existen
    }

    // Limpiar registros de migraciones obsoletas
    const hasMigrations = await queryRunner.hasTable('migrations');
    if (hasMigrations) {
      const obsoleteMigrations = [
        'AddAcceptedToUserStatusEnum%',
        'AddUserProfileFields%',
        'AddPhoneFieldsToUsers%',
        'ChangeTypeDocumentIdToString%',
        'RevertTypeDocumentIdToNumber%',
        'CreateKycVerificationsTable%',
        '%Kyc%',
        '%webhook%',
      ];

      for (const pattern of obsoleteMigrations) {
        try {
          const result = await queryRunner.query(
            `DELETE FROM migrations WHERE name LIKE $1 RETURNING *`,
            [pattern],
          );
          if (result && result.length > 0) {
            cleanedCount += result.length;
          }
        } catch (error) {
          // Ignorar errores
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`  ✓ Cleaned ${cleanedCount} obsolete elements`);
    } else {
      console.log('  ℹ️  No obsolete elements found');
    }
  }

  /**
   * Limpiar elementos obsoletos en Read Database
   */
  private async cleanReadObsoletes(queryRunner: QueryRunner): Promise<void> {
    console.log('\n🧹 Cleaning obsolete elements in READ database...');

    const hasUsers = await queryRunner.hasTable('users');
    if (!hasUsers) {
      console.log('  ℹ️  No users table to clean');
      return;
    }

    let cleanedCount = 0;

    // Eliminar índices obsoletos
    const obsoleteIndexes = [
      'IDX_USER_PROJECTIONS_EMAIL_VERIFIED',
      'IDX_USER_PROJECTIONS_KYC_STATUS',
      'IDX_USER_PROJECTIONS_TAGS',
      'IDX_USER_PROJECTIONS_SEARCH_VECTOR',
      'idx_user_proj_email_verified',
      'idx_user_proj_kyc_status',
      'idx_user_proj_tags',
      'idx_user_proj_search_vector',
      'idx_user_proj_country_status',
    ];

    for (const indexName of obsoleteIndexes) {
      try {
        await queryRunner.query(`DROP INDEX IF EXISTS "${indexName}" CASCADE;`);
        cleanedCount++;
      } catch (error) {
        // Ignorar errores
      }
    }

    // Eliminar triggers obsoletos
    try {
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS trigger_update_user_projection_search_vector 
        ON "users" CASCADE;
      `);
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS trigger_update_user_projection_updated_at 
        ON "users" CASCADE;
      `);
      cleanedCount += 2;
    } catch (error) {
      // Ignorar errores
    }

    // Eliminar funciones obsoletas
    try {
      await queryRunner.query(`
        DROP FUNCTION IF EXISTS update_user_projection_search_vector() CASCADE;
      `);
      await queryRunner.query(`
        DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      `);
      cleanedCount += 2;
    } catch (error) {
      // Ignorar errores
    }

    // Eliminar columnas obsoletas usando ALTER TABLE ... IF EXISTS
    const obsoleteColumns = [
      'email_verified',
      'first_name',
      'last_name',
      'country_code',
      'phone_number',
      'country',
      'kyc_status',
      'kyc_points_paid',
      'kyc_profile',
      'palla_account',
      'login_count',
      'last_login_ip',
      'tags',
      'search_vector',
      'last_event_version',
    ];

    // PostgreSQL no soporta DROP COLUMN IF EXISTS directamente, 
    // así que usamos DO block con manejo de excepciones
    for (const columnName of obsoleteColumns) {
      try {
        await queryRunner.query(`
          DO $$ 
          BEGIN 
            IF EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'users' 
              AND column_name = '${columnName}'
            ) THEN
              ALTER TABLE "users" DROP COLUMN "${columnName}" CASCADE;
            END IF;
          END $$;
        `);
        cleanedCount++;
      } catch (error) {
        // Ignorar errores silenciosamente
      }
    }

    // Limpiar vistas materializadas obsoletas
    try {
      await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS mv_active_users CASCADE;`);
      cleanedCount++;
    } catch (error) {
      // Ignorar errores
    }

    // Limpiar tablas de tracking obsoletas
    try {
      await queryRunner.query(`DROP TABLE IF EXISTS projection_status CASCADE;`);
      cleanedCount++;
    } catch (error) {
      // Ignorar errores
    }

    if (cleanedCount > 0) {
      console.log(`  ✓ Cleaned ${cleanedCount} obsolete elements`);
    } else {
      console.log('  ℹ️  No obsolete elements found');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const connectionName = queryRunner.connection.options.name || 'default';
    const dbName = queryRunner.connection.options.database as string || connectionName;
    const isWriteDb = connectionName === 'write' || (dbName && dbName.includes('write'));
    const isReadDb = connectionName === 'read' || (dbName && dbName.includes('read'));

    console.log(`\n⚠️  Reverting tables in connection: ${connectionName} (${dbName})...`);

    if (isWriteDb) {
      await queryRunner.dropTable('domain_events', true, true);
      await queryRunner.dropTable('users', true, true);
      console.log('✅ Write tables dropped');
    }

    if (isReadDb) {
      await queryRunner.dropTable('domain_events', true, true);
      await queryRunner.dropTable('users', true, true);
      console.log('✅ Read tables dropped');
    }
  }
}
