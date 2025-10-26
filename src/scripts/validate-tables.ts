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
  database: configService.get<string>('DB_WRITE_NAME', 'users_write'),
  entities: [],
  synchronize: false,
  logging: false,
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
  database: configService.get<string>('DB_READ_NAME', 'users_read'),
  entities: [],
  synchronize: false,
  logging: false,
});

/**
 * Validate tables in Write database
 */
async function validateWriteDatabase(dataSource: DataSource): Promise<void> {
  console.log('\n' + '═'.repeat(70));
  console.log('📝 VALIDATING WRITE DATABASE (users_write)');
  console.log('═'.repeat(70));
  
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    
    console.log(`✅ Connected to: ${(dataSource.options as any).database}`);
    console.log(`🔗 Host: ${(dataSource.options as any).host}:${(dataSource.options as any).port}`);
    
    // List all tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`\n📊 Tables found: ${tables.length}`);
    tables.forEach((table: any) => {
      console.log(`   ✓ ${table.table_name}`);
    });
    
    // Validate users table
    const usersExists = tables.some((t: any) => t.table_name === 'users');
    if (usersExists) {
      const usersColumns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      
      console.log(`\n✅ Table "users" exists with ${usersColumns.length} columns:`);
      usersColumns.forEach((col: any, index: number) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
      });
    } else {
      console.log('\n❌ Table "users" NOT FOUND');
    }
    
    // Validate domain_events table
    const eventsExists = tables.some((t: any) => t.table_name === 'domain_events');
    if (eventsExists) {
      const eventsColumns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'domain_events'
        ORDER BY ordinal_position;
      `);
      
      console.log(`\n✅ Table "domain_events" exists with ${eventsColumns.length} columns:`);
      eventsColumns.forEach((col: any, index: number) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}`);
      });
      
      // Show indexes
      const eventsIndexes = await dataSource.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'domain_events'
        ORDER BY indexname;
      `);
      console.log(`\n📑 Indexes on "domain_events": ${eventsIndexes.length}`);
      eventsIndexes.forEach((idx: any) => {
        console.log(`   ✓ ${idx.indexname}`);
      });
    } else {
      console.log('\n❌ Table "domain_events" NOT FOUND');
    }
    
  } catch (error) {
    console.error('❌ Error validating write database:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

/**
 * Validate tables in Read database
 */
async function validateReadDatabase(dataSource: DataSource): Promise<void> {
  console.log('\n' + '═'.repeat(70));
  console.log('📖 VALIDATING READ DATABASE (users_read)');
  console.log('═'.repeat(70));
  
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    
    console.log(`✅ Connected to: ${(dataSource.options as any).database}`);
    console.log(`🔗 Host: ${(dataSource.options as any).host}:${(dataSource.options as any).port}`);
    
    // List all tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`\n📊 Tables found: ${tables.length}`);
    tables.forEach((table: any) => {
      console.log(`   ✓ ${table.table_name}`);
    });
    
    // Validate users table
    const usersExists = tables.some((t: any) => t.table_name === 'users');
    if (usersExists) {
      const usersColumns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      
      console.log(`\n✅ Table "users" exists with ${usersColumns.length} columns:`);
      usersColumns.forEach((col: any, index: number) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
      });
      
      // Show indexes
      const usersIndexes = await dataSource.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
        ORDER BY indexname;
      `);
      console.log(`\n📑 Indexes on "users": ${usersIndexes.length}`);
      usersIndexes.forEach((idx: any) => {
        console.log(`   ✓ ${idx.indexname}`);
      });
    } else {
      console.log('\n❌ Table "users" NOT FOUND');
    }
    
    // Validate domain_events table
    const eventsExists = tables.some((t: any) => t.table_name === 'domain_events');
    if (eventsExists) {
      const eventsColumns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'domain_events'
        ORDER BY ordinal_position;
      `);
      
      console.log(`\n✅ Table "domain_events" exists with ${eventsColumns.length} columns:`);
      eventsColumns.forEach((col: any, index: number) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}`);
      });
      
      // Show indexes
      const eventsIndexes = await dataSource.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'domain_events'
        ORDER BY indexname;
      `);
      console.log(`\n📑 Indexes on "domain_events": ${eventsIndexes.length}`);
      eventsIndexes.forEach((idx: any) => {
        console.log(`   ✓ ${idx.indexname}`);
      });
    } else {
      console.log('\n❌ Table "domain_events" NOT FOUND');
    }
    
  } catch (error) {
    console.error('❌ Error validating read database:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

/**
 * Main validation function
 */
async function validateAllDatabases() {
  const startTime = Date.now();
  
  try {
    console.log('\n' + '═'.repeat(70));
    console.log('🔍 DATABASE TABLES VALIDATION');
    console.log('═'.repeat(70));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(70));
    
    // Validate Write database
    await validateWriteDatabase(writeDataSource);
    
    // Validate Read database
    await validateReadDatabase(readDataSource);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '═'.repeat(70));
    console.log('🎉 VALIDATION COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(70));
    console.log(`⏱️  Total duration: ${duration} seconds`);
    console.log(`📅 Completed at: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n' + '═'.repeat(70));
    console.error('💥 VALIDATION FAILED');
    console.error('═'.repeat(70));
    console.error('Error:', error);
    console.error('═'.repeat(70) + '\n');
    throw error;
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateAllDatabases()
    .then(() => {
      console.log('✅ Validation script completed successfully\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Validation script failed:', error.message);
      process.exit(1);
    });
}

export { validateAllDatabases };

