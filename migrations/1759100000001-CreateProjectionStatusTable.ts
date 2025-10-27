import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * CreateProjectionStatusTable - Migración para crear la tabla de estado de proyecciones
 * 
 * Esta migración crea la tabla projection_status que es necesaria para:
 * - Trackear el progreso de sincronización de proyecciones
 * - Mantener el último evento procesado
 * - Registrar errores y estadísticas de sincronización
 * 
 * Se ejecuta solo en la base de datos READ (users_read)
 */
export class CreateProjectionStatusTable1759100000001 implements MigrationInterface {
  name = 'CreateProjectionStatusTable1759100000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Usar el nombre de la conexión para determinar si es READ database
    const connectionName = queryRunner.connection.options.name || 'default';
    const dbName = queryRunner.connection.options.database as string || connectionName;
    const isReadDb = connectionName === 'read' || (dbName && dbName.includes('read'));

    if (!isReadDb) {
      console.log(`ℹ️  Skipping projection_status table creation in ${connectionName} (not READ database)`);
      return;
    }

    console.log(`\n📊 Creating projection_status table in READ database (${connectionName})...`);

    // Verificar si la tabla ya existe
    const hasTable = await queryRunner.hasTable('projection_status');
    if (hasTable) {
      console.log('  ℹ️  Table "projection_status" already exists');
      return;
    }

    // Crear la tabla projection_status
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
    `);

    console.log('  ✓ Table "projection_status" created with initial record');
    console.log('  ✓ Indexes created for optimization');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Solo eliminar en READ database
    const connectionName = queryRunner.connection.options.name || 'default';
    const dbName = queryRunner.connection.options.database as string || connectionName;
    const isReadDb = connectionName === 'read' || (dbName && dbName.includes('read'));

    if (!isReadDb) {
      return;
    }

    console.log(`\n⚠️  Dropping projection_status table from READ database (${connectionName})...`);

    await queryRunner.dropTable('projection_status', true, true);
    
    console.log('  ✓ Table "projection_status" dropped');
  }
}