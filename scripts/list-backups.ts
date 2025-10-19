#!/usr/bin/env tsx
/**
 * List Database Backups
 * 
 * This script lists all available database backups
 * 
 * Usage:
 *   npm run backup:list
 */

import * as fs from 'fs';
import * as path from 'path';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function listBackups() {
  const backupsDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupsDir)) {
    console.log('📁 No backups directory found');
    console.log('   Run "npm run backup:db" to create your first backup');
    return;
  }

  const files = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.sql.gz') || f.endsWith('.sql.zip')))
    .map(f => {
      const filepath = path.join(backupsDir, f);
      const stats = fs.statSync(filepath);
      return {
        name: f,
        path: filepath,
        size: stats.size,
        modified: stats.mtime
      };
    })
    .sort((a, b) => b.modified.getTime() - a.modified.getTime());

  if (files.length === 0) {
    console.log('📁 No backup files found');
    console.log('   Run "npm run backup:db" to create your first backup');
    return;
  }

  console.log(`\n📦 Available Backups (${files.length} total)\n`);
  console.log('─'.repeat(80));

  files.forEach((file, index) => {
    const isLatest = index === 0;
    const marker = isLatest ? '⭐' : '  ';
    
    console.log(`${marker} ${file.name}`);
    console.log(`   Size: ${formatBytes(file.size)}`);
    console.log(`   Date: ${formatDate(file.modified)}`);
    if (isLatest) {
      console.log(`   (Latest backup)`);
    }
    console.log('');
  });

  console.log('─'.repeat(80));
  
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  console.log(`Total size: ${formatBytes(totalSize)}\n`);
  
  console.log('💡 To restore a backup:');
  console.log('   npm run restore:db -- --latest');
  console.log('   npm run restore:db -- --file backups/backup-name.sql\n');
}

listBackups();
