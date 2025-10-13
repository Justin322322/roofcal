import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function applyProjectMaterialMigration() {
  try {
    console.log('Checking if ProjectMaterial table exists...');
    
    // Try to query the table to see if it exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM ProjectMaterial LIMIT 1`;
      console.log('✅ ProjectMaterial table already exists');
      return;
    } catch (error: any) {
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        console.log('⚠️  ProjectMaterial table does not exist, creating it...');
      } else {
        throw error;
      }
    }

    // Read and execute the migration SQL
    const migrationPath = join(process.cwd(), 'prisma/migrations/20251013014946_add_material_consumption_system/migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing migration...');
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ ProjectMaterial table created successfully');
    
    // Verify the table was created
    const result = await prisma.$queryRaw`SELECT 1 FROM ProjectMaterial LIMIT 1`;
    console.log('✅ Verification successful - table is accessible');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyProjectMaterialMigration()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

