# Database Backup Scripts

This directory contains TypeScript scripts for managing Railway MySQL database backups.

## Scripts Overview

### backup-database.ts
Creates a complete database dump including schema and data.

**Features:**
- Full database backup with mysqldump
- Automatic timestamped filenames
- Optional compression (gzip/zip)
- Automatic cleanup of old backups (keeps last 10)
- Progress indicators and file size reporting

**Usage:**
```bash
npm run backup:db                    # Create backup
npm run backup:db:compress           # Create compressed backup
npm run backup:db -- --output name   # Custom filename
```

### restore-database.ts
Restores database from a backup file.

**Features:**
- Restore from specific backup file
- Restore latest backup automatically
- Safety confirmation prompt
- Progress indicators

**Usage:**
```bash
npm run restore:db -- --latest                      # Restore latest
npm run restore:db -- --file backups/backup.sql     # Restore specific
npm run restore:db -- --latest --yes                # Skip confirmation
```

### list-backups.ts
Lists all available backup files with details.

**Features:**
- Shows all backups sorted by date
- Displays file sizes and timestamps
- Highlights latest backup
- Shows total storage used

**Usage:**
```bash
npm run backup:list
```

### setup-backup-system.ts
Verifies backup system requirements and configuration.

**Features:**
- Checks MySQL client installation
- Validates DATABASE_URL configuration
- Creates backups directory
- Verifies .gitignore configuration
- Tests database connection

**Usage:**
```bash
npm run backup:setup
```

## Requirements

1. **MySQL Client Tools**
   - Windows: `choco install mysql`
   - macOS: `brew install mysql-client`
   - Linux: `sudo apt-get install mysql-client`

2. **Environment Variables**
   - `DATABASE_URL` must be set in `.env` file
   - Format: `mysql://user:password@host:port/database`

3. **Node.js Dependencies**
   - All dependencies are already in package.json
   - Run `npm install` if needed

## File Structure

```
project/
├── scripts/
│   ├── backup-database.ts      # Create backups
│   ├── restore-database.ts     # Restore backups
│   ├── list-backups.ts         # List backups
│   └── setup-backup-system.ts  # Verify setup
├── backups/                    # Backup files (auto-created)
│   ├── backup-db-2024-10-19.sql
│   └── backup-db-2024-10-18.sql.gz
└── .env                        # DATABASE_URL configuration
```

## Security Notes

- Backup files contain sensitive data
- Never commit backups to git (already in .gitignore)
- Store backups securely
- Use encryption for cloud storage
- Rotate backups regularly

## Automation

### GitHub Actions
See `.github/workflows/database-backup.yml` for automated daily backups.

### Local Scheduling
- **Windows:** Use Task Scheduler
- **macOS/Linux:** Use cron jobs

See `docs/database-backup.md` for detailed setup instructions.

## Troubleshooting

**Command not found errors:**
- Ensure MySQL client is installed
- Check PATH environment variable
- Run `npm run backup:setup` to diagnose

**Connection errors:**
- Verify DATABASE_URL is correct
- Check Railway database status
- Ensure network connectivity

**Permission errors:**
- Check file system permissions
- Ensure backups directory is writable

## Support

For detailed documentation, see:
- `BACKUP_QUICK_START.md` - Quick reference guide
- `docs/database-backup.md` - Complete documentation

For Railway-specific issues:
- Check Railway dashboard for database status
- Verify DATABASE_URL in Railway variables
- Review Railway logs for connection issues
