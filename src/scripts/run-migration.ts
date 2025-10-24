import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: ['.env.local', '.env'] });

const configService = new ConfigService();

/**
 * Create DataSource for Write Database
 */
const writeDataSource = new DataSource({
  name: 'write',
  type: 'postgres',
  host: configService.get<string>('DB_WRITE_HOST', 'localhost'),
  port: configService.get<number>('DB_WRITE_PORT', 5432),
  username: configService.get<string>('DB_WRITE_USERNAME', 'postgres'),
  password: configService.get<string>('DB_WRITE_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_WRITE_NAME', 'auth_write'),
  entities: [],
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: configService.get<boolean>('DB_LOGGING', false),
  migrationsRun: false,
  migrationsTableName: 'migrations',
});

/**
 * Create DataSource for Read Database
 */
const readDataSource = new DataSource({
  name: 'read',
  type: 'postgres',
  host: configService.get<string>('DB_READ_HOST', 'localhost'),
  port: configService.get<number>('DB_READ_PORT', 5432),
  username: configService.get<string>('DB_READ_USERNAME', 'postgres'),
  password: configService.get<string>('DB_READ_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_READ_NAME', 'auth_read'),
  entities: [],
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: configService.get<boolean>('DB_LOGGING', false),
  migrationsRun: false,
  migrationsTableName: 'migrations',
});

/**
 * Run migrations on a specific DataSource
 */
async function runMigrationsOnDataSource(dataSource: DataSource, dbType: string): Promise<void> {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Running migrations on ${dbType.toUpperCase()} database...`);
    console.log(`📁 Database: ${(dataSource.options as any).database}`);
    console.log(`🔗 Host: ${(dataSource.options as any).host}:${(dataSource.options as any).port}`);
    console.log(`${'='.repeat(60)}\n`);

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log(`✅ Connected to ${dbType} database`);
    }

    // Show pending migrations
    const pendingMigrations = await dataSource.showMigrations();
    if (pendingMigrations) {
      console.log(`⏳ Found pending migrations for ${dbType}`);
    } else {
      console.log(`✨ No pending migrations for ${dbType}`);
      return;
    }

    // Run migrations
    const executedMigrations = await dataSource.runMigrations();

    if (executedMigrations.length === 0) {
      console.log(`✅ ${dbType} database is up to date`);
    } else {
      console.log(`🎉 Successfully executed ${executedMigrations.length} migration(s) on ${dbType}:`);
      executedMigrations.forEach(migration => {
        console.log(`   ✓ ${migration.name}`);
      });
    }

    console.log(`✅ ${dbType} migrations completed!\n`);

  } catch (error) {
    console.error(`❌ Error running migrations on ${dbType}:`, error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log(`🔌 ${dbType} connection closed\n`);
    }
  }
}

/**
 * Main function to run migrations on both databases
 */
async function runAllMigrations() {
  const startTime = Date.now();
  
  try {
    console.log('\n' + '═'.repeat(70));
    console.log('🚀 INITIALIZING MIGRATION PROCESS');
    console.log('═'.repeat(70));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(70));

    // Run migrations on Write database
    await runMigrationsOnDataSource(writeDataSource, 'WRITE');

    // Run migrations on Read database
    await runMigrationsOnDataSource(readDataSource, 'READ');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('═'.repeat(70));
    console.log('🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(70));
    console.log(`⏱️  Total duration: ${duration} seconds`);
    console.log(`📅 Completed at: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n' + '═'.repeat(70));
    console.error('💥 MIGRATION PROCESS FAILED');
    console.error('═'.repeat(70));
    console.error('Error:', error);
    console.error('═'.repeat(70) + '\n');
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      console.log('✅ Migration script completed successfully\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error.message);
      process.exit(1);
    });
}

export { writeDataSource, readDataSource, runAllMigrations };
