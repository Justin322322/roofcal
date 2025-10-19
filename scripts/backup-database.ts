#!/usr/bin/env tsx
/**
 * Database Backup Script for Railway MySQL
 * 
 * This script creates a complete database dump including:
 * - Schema structure
 * - All table data
 * - Stored procedures, triggers, etc.
 * 
 * Usage:
 *   npm run backup:db
 *   npm run backup:db -- --output custom-backup.sql
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface BackupOptions {
  output?: string;
  compress?: boolean;
}

// Parse DATABASE_URL to extract connection details
function parseDatabaseUrl(url: string) {
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

async function createBackup(options: BackupOptions = {}) {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🔍 Parsing database connection...');
  const dbConfig = parseDatabaseUrl(databaseUrl);
  
  // Create backups directory if it doesn't exist
  const backupsDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log('📁 Created backups directory');
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = options.output || `backup-${dbConfig.database}-${timestamp}.sql`;
  const filepath = path.join(backupsDir, filename);

  console.log(`📦 Creating backup: ${filename}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);

  // Build mysqldump command
  const dumpCommand = [
    'mysqldump',
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--user=${dbConfig.user}`,
    `--password=${dbConfig.password}`,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--events',
    '--add-drop-table',
    '--complete-insert',
    '--extended-insert',
    '--set-charset',
    '--default-character-set=utf8mb4',
    dbConfig.database,
    `> "${filepath}"`
  ].join(' ');

  try {
    console.log('⏳ Dumping database...');
    await execAsync(dumpCommand, { 
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
    });

    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Backup completed successfully!`);
    console.log(`   File: ${filepath}`);
    console.log(`   Size: ${fileSizeMB} MB`);

    // Optional: Compress the backup
    if (options.compress) {
      console.log('🗜️  Compressing backup...');
      const gzipCommand = process.platform === 'win32' 
        ? `powershell -Command "Compress-Archive -Path '${filepath}' -DestinationPath '${filepath}.zip' -Force"`
        : `gzip -f "${filepath}"`;
      
      await execAsync(gzipCommand);
      const compressedPath = process.platform === 'win32' ? `${filepath}.zip` : `${filepath}.gz`;
      const compressedStats = fs.statSync(compressedPath);
      const compressedSizeMB = (compressedStats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ Compression completed!`);
      console.log(`   File: ${compressedPath}`);
      console.log(`   Size: ${compressedSizeMB} MB`);
      
      // Remove uncompressed file
      if (process.platform !== 'win32') {
        console.log(`🗑️  Removed uncompressed file`);
      }
    }

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
  }
}

async function cleanupOldBackups(backupsDir: string, keepCount: number) {
  const files = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.sql.gz') || f.endsWith('.sql.zip')))
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
  } else if (args[i] === '--compress') {
    options.compress = true;
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
