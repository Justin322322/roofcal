#!/usr/bin/env tsx
/**
 * Database Restore Script for Railway MySQL
 * 
 * This script restores a database from a backup file
 * 
 * Usage:
 *   npm run restore:db -- --file backups/backup-2024-01-01.sql
 *   npm run restore:db -- --latest
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const execAsync = promisify(exec);

interface RestoreOptions {
  file?: string;
  latest?: boolean;
  skipConfirmation?: boolean;
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

async function confirmRestore(dbName: string, backupFile: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(
      `⚠️  WARNING: This will REPLACE all data in database "${dbName}" with data from:\n   ${backupFile}\n\n   Type "yes" to continue: `,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

function getLatestBackup(backupsDir: string): string | null {
  if (!fs.existsSync(backupsDir)) {
    return null;
  }

  const files = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(backupsDir, f),
      time: fs.statSync(path.join(backupsDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  return files.length > 0 ? files[0].path : null;
}

async function restoreBackup(options: RestoreOptions) {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🔍 Parsing database connection...');
  const dbConfig = parseDatabaseUrl(databaseUrl);

  // Determine backup file to restore
  let backupFile: string;
  
  if (options.latest) {
    const backupsDir = path.join(process.cwd(), 'backups');
    const latestBackup = getLatestBackup(backupsDir);
    
    if (!latestBackup) {
      throw new Error('No backup files found in backups directory');
    }
    
    backupFile = latestBackup;
    console.log(`📦 Using latest backup: ${path.basename(backupFile)}`);
  } else if (options.file) {
    backupFile = path.isAbsolute(options.file) 
      ? options.file 
      : path.join(process.cwd(), options.file);
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
  } else {
    throw new Error('Please specify --file or --latest option');
  }

  // Confirm restore operation
  if (!options.skipConfirmation) {
    const confirmed = await confirmRestore(dbConfig.database, backupFile);
    
    if (!confirmed) {
      console.log('❌ Restore cancelled by user');
      return;
    }
  }

  console.log(`\n🔄 Restoring database: ${dbConfig.database}`);
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   From: ${backupFile}`);

  // Build mysql restore command
  const restoreCommand = [
    'mysql',
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--user=${dbConfig.user}`,
    `--password=${dbConfig.password}`,
    dbConfig.database,
    `< "${backupFile}"`
  ].join(' ');

  try {
    console.log('⏳ Restoring database...');
    await execAsync(restoreCommand, { 
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
    });

    console.log(`✅ Database restored successfully!`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   From: ${path.basename(backupFile)}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Restore failed:', errorMessage);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: RestoreOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    options.file = args[i + 1];
    i++;
  } else if (args[i] === '--latest') {
    options.latest = true;
  } else if (args[i] === '--yes' || args[i] === '-y') {
    options.skipConfirmation = true;
  }
}

// Run restore
restoreBackup(options)
  .then(() => {
    console.log('\n✨ Restore process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Restore process failed:', error);
    process.exit(1);
  });
