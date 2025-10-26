import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * AddProjectionStatusTable - Migración para crear tabla de estado de proyecciones
 * 
 * Esta migración:
 * - Crea la tabla projection_status en la base de datos de lectura
 * - Permite el tracking del progreso de sincronización de proyecciones
 * - Es necesaria para el funcionamiento del ProjectionSyncService
 */
export class AddProjectionStatusTable1759200000000 implements MigrationInterface {
  name = 'AddProjectionStatusTable1759200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Usar el nombre de la conexión para determinar si es la base de datos de lectura
    const connectionName = queryRunner.connection.options.name || 'default';
    const dbName = queryRunner.connection.options.database as string || connectionName;
    const isReadDb = connectionName === 'read' || (dbName && dbName.includes('read'));

    if (!isReadDb) {
      console.log(`ℹ️  Skipping projection_status table creation in ${connectionName} (not read database)`);
      return;
    }

    console.log(`\n📊 Creating projection_status table in ${connectionName}...`);

    // Verificar si la tabla ya existe
    const hasProjectionStatus = await queryRunner.hasTable('projection_status');
    if (hasProjectionStatus) {
      console.log('  ℹ️  Table "projection_status" already exists');
      return;
    }

    // Crear tabla projection_status
    await queryRunner.createTable(
      new Table({
        name: 'projection_status',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
            comment: 'Primary key',
          },
          {
            name: 'projection_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
            comment: 'Name of the projection (e.g., user)',
          },
          {
            name: 'last_processed_version',
            type: 'int',
            default: 0,
            isNullable: false,
            comment: 'Last processed event version',
          },
          {
            name: 'last_processed_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'When the last event was processed',
          },
          {
            name: 'total_events_processed',
            type: 'int',
            default: 0,
            isNullable: false,
            comment: 'Total number of events processed',
          },
          {
            name: 'error_count',
            type: 'int',
            default: 0,
            isNullable: false,
            comment: 'Number of processing errors',
          },
          {
            name: 'last_error',
            type: 'text',
            isNullable: true,
            comment: 'Last error message',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Record creation timestamp',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Last update timestamp',
          },
        ],
      }),
      true,
    );

    // Crear índices para optimizar consultas
    await queryRunner.query(`
      CREATE INDEX "IDX_PROJECTION_STATUS_NAME" 
      ON "projection_status" ("projection_name");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_PROJECTION_STATUS_UPDATED_AT" 
      ON "projection_status" ("updated_at" DESC);
    `);

    // Insertar registro inicial para la proyección de usuarios
    await queryRunner.query(`
      INSERT INTO projection_status (
        projection_name, 
        last_processed_version, 
        total_events_processed,
        created_at,
        updated_at
      ) VALUES (
        'user', 
        0, 
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (projection_name) DO NOTHING;
    `);

    console.log('  ✓ Table "projection_status" created with initial data');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const connectionName = queryRunner.connection.options.name || 'default';
    const dbName = queryRunner.connection.options.database as string || connectionName;
    const isReadDb = connectionName === 'read' || (dbName && dbName.includes('read'));

    if (!isReadDb) {
      console.log(`ℹ️  Skipping projection_status table drop in ${connectionName} (not read database)`);
      return;
    }

    console.log(`\n⚠️  Dropping projection_status table from ${connectionName}...`);

    await queryRunner.dropTable('projection_status', true, true);

    console.log('  ✓ Table "projection_status" dropped');
  }
}