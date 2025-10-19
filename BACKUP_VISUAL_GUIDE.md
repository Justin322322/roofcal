# 📸 Database Backup System - Visual Guide

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Railway MySQL Database                     │
│                  (Your Production Data)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ DATABASE_URL
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backup System                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Create     │  │    List      │  │   Restore    │      │
│  │   Backup     │  │   Backups    │  │   Backup     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    backups/ Directory                        │
│  📦 backup-db-2024-10-19T14-30-00.sql.gz                    │
│  📦 backup-db-2024-10-18T10-15-00.sql.gz                    │
│  📦 backup-db-2024-10-17T02-00-00.sql.gz                    │
│  (Keeps last 10 backups automatically)                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Backup Workflow

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Run: npm run backup:db  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Connect to Railway DB   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Export all data         │
│ (mysqldump)             │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Save to backups/        │
│ with timestamp          │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Compress (optional)     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Cleanup old backups     │
│ (keep last 10)          │
└──────┬──────────────────┘
       │
       ▼
┌─────────────┐
│   DONE ✅   │
└─────────────┘
```

## 🔙 Restore Workflow

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│ Run: npm run restore:db  │
│      --latest            │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Select backup file       │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ ⚠️  Confirmation Prompt  │
│ "Replace all data?"      │
└──────┬───────────────────┘
       │
       ├─── NO ──→ Cancel
       │
       YES
       │
       ▼
┌──────────────────────────┐
│ Connect to Railway DB    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Import backup data       │
│ (mysql restore)          │
└──────┬───────────────────┘
       │
       ▼
┌─────────────┐
│   DONE ✅   │
└─────────────┘
```

## 🤖 Automated Backup (GitHub Actions)

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Actions                          │
│                                                              │
│  Trigger: Daily at 2 AM UTC (or manual)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. Checkout code                                    │    │
│  │ 2. Setup Node.js                                    │    │
│  │ 3. Install MySQL client                             │    │
│  │ 4. Run: npm run backup:db:compress                  │    │
│  │ 5. Upload to GitHub Artifacts (30 days)            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Optional: Upload to S3/GCS for long-term storage           │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Command Cheat Sheet

```
╔═══════════════════════════════════════════════════════════════╗
║                    BACKUP COMMANDS                            ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  🔧 SETUP                                                     ║
║  npm run backup:setup          Verify system requirements    ║
║                                                               ║
║  📦 CREATE BACKUP                                             ║
║  npm run backup:db             Create backup                 ║
║  npm run backup:db:compress    Create compressed backup      ║
║                                                               ║
║  📋 VIEW BACKUPS                                              ║
║  npm run backup:list           List all backups              ║
║                                                               ║
║  🔄 RESTORE                                                   ║
║  npm run restore:db -- --latest                              ║
║                                Restore latest backup         ║
║  npm run restore:db -- --file backups/backup.sql             ║
║                                Restore specific backup       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## 🎬 Step-by-Step First Backup

```
Step 1: Install MySQL Client
┌─────────────────────────────────────┐
│ Windows: choco install mysql        │
│ macOS:   brew install mysql-client  │
│ Linux:   apt-get install mysql      │
└─────────────────────────────────────┘
                │
                ▼
Step 2: Verify Setup
┌─────────────────────────────────────┐
│ npm run backup:setup                │
│                                     │
│ Output:                             │
│ ✅ MySQL client installed           │
│ ✅ DATABASE_URL configured          │
│ ✅ Backups directory ready          │
│ ✅ Gitignore configured             │
│ ✅ Database connection OK           │
└─────────────────────────────────────┘
                │
                ▼
Step 3: Create First Backup
┌─────────────────────────────────────┐
│ npm run backup:db:compress          │
│                                     │
│ Output:                             │
│ 🔍 Parsing database connection...   │
│ 📦 Creating backup...               │
│ ⏳ Dumping database...              │
│ ✅ Backup completed!                │
│    File: backup-db-2024-10-19.sql  │
│    Size: 2.45 MB                    │
│ 🗜️  Compressing backup...           │
│ ✅ Compression completed!           │
│    Size: 0.45 MB                    │
└─────────────────────────────────────┘
                │
                ▼
Step 4: Verify Backup
┌─────────────────────────────────────┐
│ npm run backup:list                 │
│                                     │
│ Output:                             │
│ 📦 Available Backups (1 total)      │
│ ⭐ backup-db-2024-10-19.sql.gz      │
│    Size: 0.45 MB                    │
│    Date: 10/19/2024, 14:30:00      │
│    (Latest backup)                  │
└─────────────────────────────────────┘
                │
                ▼
           ✅ DONE!
```

## 🔐 Security Checklist

```
✅ Backups excluded from git (.gitignore)
✅ DATABASE_URL stored in .env (not committed)
✅ Confirmation required before restore
✅ Automatic cleanup of old backups
✅ Secure credential handling
✅ GitHub Secrets for automated backups

⚠️  TODO:
□  Set up off-site backup storage (S3/GCS)
□  Test restore process
□  Schedule regular backups
□  Document recovery procedures
```

## 📅 Recommended Backup Schedule

```
┌─────────────────────────────────────────────────────────┐
│                   Backup Schedule                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🌙 DAILY (Automated)                                    │
│     2:00 AM UTC - GitHub Actions                        │
│     Retention: 30 days                                  │
│                                                          │
│  📅 WEEKLY (Manual)                                      │
│     Sunday - Full backup to cloud storage               │
│     Retention: 90 days                                  │
│                                                          │
│  📆 MONTHLY (Manual)                                     │
│     1st of month - Archive backup                       │
│     Retention: 1 year                                   │
│                                                          │
│  ⚡ ON-DEMAND                                            │
│     Before migrations                                   │
│     Before major updates                                │
│     Before data imports                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🆘 Quick Troubleshooting

```
Problem: "mysqldump: command not found"
Solution: Install MySQL client tools
         → See Step 1 in First Backup guide

Problem: "DATABASE_URL not set"
Solution: Add to .env file
         → Get from Railway dashboard

Problem: "Connection failed"
Solution: Check Railway database status
         → Verify DATABASE_URL is correct

Problem: "Permission denied"
Solution: Check file permissions
         → Ensure backups/ is writable

Problem: "Backup too large"
Solution: Use compression
         → npm run backup:db:compress
```

## 📚 Documentation Map

```
┌─────────────────────────────────────────────────────────┐
│                  Documentation Files                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📄 DATABASE_BACKUP_SYSTEM.md                           │
│     └─→ Overview and installation summary              │
│                                                          │
│  📄 BACKUP_QUICK_START.md                               │
│     └─→ Quick reference guide (START HERE!)            │
│                                                          │
│  📄 BACKUP_VISUAL_GUIDE.md                              │
│     └─→ Visual diagrams and workflows (THIS FILE)      │
│                                                          │
│  📄 docs/database-backup.md                             │
│     └─→ Complete technical documentation               │
│                                                          │
│  📄 scripts/README.md                                   │
│     └─→ Script technical details                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**Need Help?** Start with `BACKUP_QUICK_START.md` for quick commands!
