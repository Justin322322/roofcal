# Database Backup - Quick Start Guide

## 🚀 Setup (One-time)

1. **Install MySQL Client Tools**

   **Windows:**
   ```bash
   choco install mysql
   ```

   **macOS:**
   ```bash
   brew install mysql-client
   ```

   **Linux:**
   ```bash
   sudo apt-get install mysql-client
   ```

2. **Verify Setup**
   ```bash
   npm run backup:setup
   ```

## 📦 Creating Backups

**Create a backup:**
```bash
npm run backup:db
```

**Create compressed backup (recommended):**
```bash
npm run backup:db:compress
```

Backups are saved to `backups/` directory with timestamps.

## 📋 View Backups

```bash
npm run backup:list
```

## 🔄 Restore Database

**Restore latest backup:**
```bash
npm run restore:db -- --latest
```

**Restore specific backup:**
```bash
npm run restore:db -- --file backups/backup-name.sql
```

⚠️ **WARNING:** This will replace ALL data in your database!

## 🤖 Automated Backups

### GitHub Actions (Recommended)

The system includes a GitHub Actions workflow that:
- Runs daily at 2 AM UTC
- Can be triggered manually
- Stores backups for 30 days

**Setup:**
1. Go to your GitHub repository settings
2. Navigate to Secrets and Variables → Actions
3. Add secret: `DATABASE_URL` with your Railway database URL
4. The workflow will run automatically

**Manual trigger:**
1. Go to Actions tab in GitHub
2. Select "Automated Database Backup"
3. Click "Run workflow"

### Local Scheduled Backups

**Windows Task Scheduler:**
1. Open Task Scheduler
2. Create Basic Task
3. Set schedule (daily/weekly)
4. Action: `cmd.exe /c cd /d "C:\path\to\project" && npm run backup:db:compress`

**macOS/Linux Cron:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run backup:db:compress
```

## 📤 Upload to Cloud Storage

### AWS S3
```bash
npm run backup:db:compress
aws s3 cp backups/ s3://your-bucket/backups/ --recursive
```

### Google Cloud Storage
```bash
npm run backup:db:compress
gsutil -m cp backups/*.sql.gz gs://your-bucket/backups/
```

## 🔧 Troubleshooting

**"mysqldump: command not found"**
- Install MySQL client tools (see Setup section)

**"DATABASE_URL not set"**
- Add to `.env` file: `DATABASE_URL="mysql://user:pass@host:port/db"`
- Get from Railway dashboard → Database → Variables

**"Connection failed"**
- Verify DATABASE_URL is correct
- Check Railway database is running
- Ensure network access (Railway may require IP whitelisting)

## 📚 Full Documentation

See `docs/database-backup.md` for complete documentation including:
- Advanced options
- Security best practices
- Backup retention policies
- Cloud storage integration
- Troubleshooting guide

## 🎯 Best Practices

1. **Backup before changes:** Always backup before migrations or major updates
2. **Test restores:** Periodically test restoring backups
3. **Off-site storage:** Store backups in cloud storage
4. **Regular schedule:** Run daily automated backups
5. **Monitor backups:** Check backup logs regularly

## 📞 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm run backup:setup` | Verify backup system setup |
| `npm run backup:db` | Create database backup |
| `npm run backup:db:compress` | Create compressed backup |
| `npm run backup:list` | List all backups |
| `npm run restore:db -- --latest` | Restore latest backup |
| `npm run restore:db -- --file <path>` | Restore specific backup |

---

**Need help?** Check `docs/database-backup.md` for detailed documentation.
