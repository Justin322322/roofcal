#!/usr/bin/env tsx
/**
 * Database Backup Script for Railway MySQL
 * 
 * This script creates a complete database dump using Prisma
 * Works on any platform without requiring mysqldump
 * 
 * Usage:
 *   npm run backup:db
 *   npm run backup:db -- --output custom-backup.sql
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BackupOptions {
  output?: string;
}

async function generateSQLBackup() {
  const tables = [
    'user',
    'project',
    'PricingConfig',
    'warehouse',
    'WarehouseMaterial',
    'ProjectMaterial',
    'Notification',
    'activity',
    'verificationcode',
    'ratelimit',
    'systemsettings',
  ];

  let sqlContent = `-- Database Backup\n`;
  sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
  sqlContent += `-- Platform: Prisma-based backup\n\n`;
  sqlContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

  for (const table of tables) {
    try {
      const modelName = table.charAt(0).toLowerCase() + table.slice(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await (prisma as any)[modelName]?.findMany();

      if (!data || data.length === 0) {
        console.log(`  ⏭️  Skipping empty table: ${table}`);
        continue;
      }

      console.log(`  📦 Backing up ${table}: ${data.length} records`);

      sqlContent += `-- Table: ${table}\n`;
      sqlContent += `DELETE FROM \`${table}\`;\n`;

      for (const row of data) {
        const columns = Object.keys(row);
        const values = columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? '1' : '0';
          if (typeof val === 'number') return val.toString();
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });

        sqlContent += `INSERT INTO \`${table}\` (\`${columns.join('`, `')}\`) VALUES (${values.join(', ')});\n`;
      }

      sqlContent += `\n`;
    } catch (error) {
      console.error(`  ❌ Error backing up table ${table}:`, error);
    }
  }

  sqlContent += `SET FOREIGN_KEY_CHECKS=1;\n`;
  return sqlContent;
}

async function createBackup(options: BackupOptions = {}) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🔍 Connecting to database...');
  
  // Create backups directory if it doesn't exist
  const backupsDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log('📁 Created backups directory');
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = options.output || `backup-${timestamp}.sql`;
  const filepath = path.join(backupsDir, filename);

  console.log(`📦 Creating backup: ${filename}`);
  console.log('⏳ Reading database tables...\n');

  try {
    // Generate SQL backup using Prisma
    const sqlContent = await generateSQLBackup();
    
    // Write to file
    fs.writeFileSync(filepath, sqlContent, 'utf-8');

    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`   File: ${filepath}`);
    console.log(`   Size: ${fileSizeMB} MB`);

    // Clean up old backups (keep last 10)
    await cleanupOldBackups(backupsDir, 10);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Backup failed:', errorMessage);
    
    // Clean up partial backup file
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupOldBackups(backupsDir: string, keepCount: number) {
  const files = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(backupsDir, f),
      time: fs.statSync(path.join(backupsDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length > keepCount) {
    console.log(`🧹 Cleaning up old backups (keeping ${keepCount} most recent)...`);
    const filesToDelete = files.slice(keepCount);
    
    for (const file of filesToDelete) {
      fs.unlinkSync(file.path);
      console.log(`   Deleted: ${file.name}`);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: BackupOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    options.output = args[i + 1];
    i++;
  }
}

// Run backup
createBackup(options)
  .then(() => {
    console.log('\n✨ Backup process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Backup process failed:', error);
    process.exit(1);
  });
