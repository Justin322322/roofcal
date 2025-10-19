# Database Backup System

This document describes the database backup and restore system for the Railway MySQL database.

## Overview

The backup system provides automated database dumps including:
- Complete schema structure
- All table data
- Stored procedures, triggers, and events
- Automatic cleanup of old backups

## Prerequisites

### MySQL Client Tools

You need MySQL client tools installed on your system:

**Windows:**
```bash
# Using Chocolatey
choco install mysql

# Or download from: https://dev.mysql.com/downloads/mysql/
```

**macOS:**
```bash
brew install mysql-client
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install mysql-client

# CentOS/RHEL
sudo yum install mysql
```

### Environment Variables

Ensure your `.env` file has the `DATABASE_URL` configured:
```env
DATABASE_URL="mysql://user:password@host:port/database"
```

For Railway, you can find this in your Railway project dashboard under "Variables".

## Usage

### Creating a Backup

**Basic backup:**
```bash
npm run backup:db
```

This creates a backup file in the `backups/` directory with a timestamp:
```
backups/backup-database-2024-10-19T14-30-00.sql
```

**Compressed backup:**
```bash
npm run backup:db:compress
```

Creates a compressed backup (`.gz` on Unix, `.zip` on Windows) to save disk space.

**Custom filename:**
```bash
npm run backup:db -- --output my-backup.sql
```

### Listing Backups

View all available backups:
```bash
npm run backup:list
```

Output example:
```
📦 Available Backups (5 total)

⭐ backup-database-2024-10-19T14-30-00.sql
   Size: 2.45 MB
   Date: 10/19/2024, 14:30:00
   (Latest backup)

   backup-database-2024-10-18T10-15-00.sql
   Size: 2.42 MB
   Date: 10/18/2024, 10:15:00
```

### Restoring a Backup

**Restore latest backup:**
```bash
npm run restore:db -- --latest
```

**Restore specific backup:**
```bash
npm run restore:db -- --file backups/backup-database-2024-10-19.sql
```

**Skip confirmation prompt:**
```bash
npm run restore:db -- --latest --yes
```

⚠️ **WARNING:** Restoring will replace ALL data in your database. Always confirm you're restoring to the correct database.

## Automated Backups

### Using Cron (Linux/macOS)

Add to your crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run backup:db:compress

# Weekly backup on Sunday at 3 AM
0 3 * * 0 cd /path/to/project && npm run backup:db:compress
```

### Using Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (daily, weekly, etc.)
4. Action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c cd /d "C:\path\to\project" && npm run backup:db:compress`

### Using GitHub Actions

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install MySQL client
        run: sudo apt-get install -y mysql-client
      
      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run backup:db:compress
      
      - name: Upload backup artifact
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/
          retention-days: 30
```

## Backup Retention

By default, the system keeps the **10 most recent backups** and automatically deletes older ones. This prevents disk space issues while maintaining a reasonable backup history.

To change retention, edit `scripts/backup-database.ts`:
```typescript
await cleanupOldBackups(backupsDir, 10); // Change 10 to your desired count
```

## Best Practices

1. **Regular Backups**: Schedule daily backups at minimum
2. **Off-site Storage**: Store backups in a different location (cloud storage, different server)
3. **Test Restores**: Periodically test restoring backups to ensure they work
4. **Before Major Changes**: Always create a backup before:
   - Database migrations
   - Major data imports/updates
   - Schema changes
   - Production deployments

## Backup to Cloud Storage

### AWS S3 Example

```bash
# After creating backup
npm run backup:db:compress

# Upload to S3
aws s3 cp backups/ s3://your-bucket/database-backups/ --recursive --exclude "*" --include "backup-*.sql.gz"
```

### Google Cloud Storage Example

```bash
# After creating backup
npm run backup:db:compress

# Upload to GCS
gsutil -m cp backups/backup-*.sql.gz gs://your-bucket/database-backups/
```

## Troubleshooting

### "mysqldump: command not found"

Install MySQL client tools (see Prerequisites section).

### "Access denied for user"

Check your DATABASE_URL credentials. For Railway:
1. Go to your Railway project
2. Click on your database service
3. Copy the DATABASE_URL from Variables tab

### "Backup file too large"

Use compression:
```bash
npm run backup:db:compress
```

### "Connection timeout"

Railway databases may have connection limits. Try:
1. Check Railway service status
2. Verify your IP is not blocked
3. Check if database is sleeping (Railway free tier)

## Security Notes

- Never commit backup files to git (already in `.gitignore`)
- Store backups securely with encryption if they contain sensitive data
- Rotate backup encryption keys regularly
- Limit access to backup files
- Use secure transfer methods (SFTP, SCP, encrypted cloud storage)

## Serverless Platforms (Vercel, Railway, etc.)

If you're running on a serverless platform, backups work differently:

- ✅ Backups are **automatically downloaded** when created
- ⚠️ Server-side storage is **ephemeral** (doesn't persist)
- 📤 Use **file upload** to restore backups
- ☁️ Consider **cloud storage** for production

**See:** `docs/serverless-backup-guide.md` for detailed serverless instructions.

## Support

For issues or questions:
1. Check Railway database logs
2. Verify MySQL client version compatibility
3. Test connection with `mysql` command directly
4. Review backup script logs for detailed error messages
5. For serverless issues, see `docs/serverless-backup-guide.md`
