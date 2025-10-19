#!/usr/bin/env tsx
/**
 * Setup Backup System
 * 
 * This script verifies that all requirements for the backup system are met
 * 
 * Usage:
 *   npm run backup:setup
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  fix?: string;
}

async function checkMySQLClient(): Promise<CheckResult> {
  try {
    const { stdout } = await execAsync('mysqldump --version');
    return {
      name: 'MySQL Client',
      passed: true,
      message: `✅ MySQL client installed: ${stdout.trim()}`
    };
  } catch {
    return {
      name: 'MySQL Client',
      passed: false,
      message: '❌ MySQL client not found',
      fix: process.platform === 'win32'
        ? 'Install: choco install mysql or download from https://dev.mysql.com/downloads/mysql/'
        : process.platform === 'darwin'
        ? 'Install: brew install mysql-client'
        : 'Install: sudo apt-get install mysql-client'
    };
  }
}

async function checkDatabaseUrl(): Promise<CheckResult> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return {
      name: 'Database URL',
      passed: false,
      message: '❌ DATABASE_URL not set in environment',
      fix: 'Add DATABASE_URL to your .env file'
    };
  }

  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const isValid = regex.test(databaseUrl);

  if (!isValid) {
    return {
      name: 'Database URL',
      passed: false,
      message: '❌ DATABASE_URL format is invalid',
      fix: 'Format should be: mysql://user:password@host:port/database'
    };
  }

  return {
    name: 'Database URL',
    passed: true,
    message: '✅ DATABASE_URL is configured correctly'
  };
}

async function checkBackupsDirectory(): Promise<CheckResult> {
  const backupsDir = path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupsDir)) {
    try {
      fs.mkdirSync(backupsDir, { recursive: true });
      return {
        name: 'Backups Directory',
        passed: true,
        message: '✅ Created backups directory'
      };
    } catch {
      return {
        name: 'Backups Directory',
        passed: false,
        message: '❌ Failed to create backups directory',
        fix: 'Manually create a "backups" folder in your project root'
      };
    }
  }

  return {
    name: 'Backups Directory',
    passed: true,
    message: '✅ Backups directory exists'
  };
}

async function checkGitignore(): Promise<CheckResult> {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    return {
      name: 'Gitignore',
      passed: false,
      message: '⚠️  .gitignore not found',
      fix: 'Create a .gitignore file to prevent committing backups'
    };
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const hasBackupsIgnore = content.includes('/backups') || content.includes('backups/');
  const hasSqlIgnore = content.includes('*.sql');

  if (!hasBackupsIgnore || !hasSqlIgnore) {
    return {
      name: 'Gitignore',
      passed: false,
      message: '⚠️  .gitignore missing backup entries',
      fix: 'Add to .gitignore:\n/backups\n*.sql\n*.sql.gz\n*.sql.zip'
    };
  }

  return {
    name: 'Gitignore',
    passed: true,
    message: '✅ Gitignore configured correctly'
  };
}

async function testDatabaseConnection(): Promise<CheckResult> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return {
      name: 'Database Connection',
      passed: false,
      message: '⏭️  Skipped (DATABASE_URL not set)'
    };
  }

  try {
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = databaseUrl.match(regex);
    
    if (!match) {
      return {
        name: 'Database Connection',
        passed: false,
        message: '⏭️  Skipped (invalid DATABASE_URL format)'
      };
    }

    const [, user, password, host, port, database] = match;
    
    const testCommand = [
      'mysql',
      `--host=${host}`,
      `--port=${port}`,
      `--user=${user}`,
      `--password=${password}`,
      '--execute="SELECT 1"',
      database
    ].join(' ');

    await execAsync(testCommand, { timeout: 5000 });

    return {
      name: 'Database Connection',
      passed: true,
      message: '✅ Successfully connected to database'
    };
  } catch {
    return {
      name: 'Database Connection',
      passed: false,
      message: '❌ Failed to connect to database',
      fix: 'Verify your DATABASE_URL credentials and network access'
    };
  }
}

async function runSetup() {
  console.log('🔧 Database Backup System Setup\n');
  console.log('Checking requirements...\n');

  const checks: CheckResult[] = [];

  // Run all checks
  checks.push(await checkMySQLClient());
  checks.push(await checkDatabaseUrl());
  checks.push(await checkBackupsDirectory());
  checks.push(await checkGitignore());
  checks.push(await testDatabaseConnection());

  // Display results
  console.log('─'.repeat(80));
  for (const check of checks) {
    console.log(`\n${check.message}`);
    if (check.fix) {
      console.log(`   Fix: ${check.fix}`);
    }
  }
  console.log('\n' + '─'.repeat(80));

  // Summary
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✨ All checks passed! Your backup system is ready to use.\n');
    console.log('Try creating your first backup:');
    console.log('   npm run backup:db\n');
    return true;
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above.\n');
    return false;
  }
}

runSetup()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
