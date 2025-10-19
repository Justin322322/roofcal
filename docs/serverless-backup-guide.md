# Database Backup on Serverless Platforms

## Overview

When running on serverless platforms (Vercel, Railway, AWS Lambda, etc.), the filesystem is read-only except for `/tmp`. This guide explains how the backup system works in these environments.

## How It Works

### Creating Backups

1. **Automatic Download**: When you create a backup via the web UI, it's automatically downloaded to your computer
2. **Temporary Storage**: The backup is created in `/tmp` on the server (which is ephemeral)
3. **No Persistence**: Server-side backups don't persist between deployments or restarts

### Restoring Backups

You have two options:

#### Option 1: Upload a Backup File (Recommended for Serverless)
1. Click "Restore Backup" in the Database Management page
2. Click "Choose File" and select your `.sql` backup file
3. Click "Restore Database"
4. The file is uploaded and restored directly

#### Option 2: Use Server Backups (If Available)
- Only works if backups were created recently in the same session
- Not reliable on serverless platforms due to ephemeral storage

## Best Practices for Serverless

### 1. Always Download Backups Immediately
When you create a backup, it's automatically downloaded. **Keep these files safe!**

```
✅ DO: Save backups to your local computer
✅ DO: Upload backups to cloud storage (S3, Google Drive, etc.)
❌ DON'T: Rely on server-side backup storage
```

### 2. Use Cloud Storage for Long-term Backups

For production environments, integrate with cloud storage:

#### AWS S3 Example
```typescript
// Add to your backup route after creating the backup
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-east-1" });

await s3Client.send(new PutObjectCommand({
  Bucket: "your-backup-bucket",
  Key: `backups/${filename}`,
  Body: fileContent,
}));
```

#### Google Cloud Storage Example
```typescript
import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const bucket = storage.bucket("your-backup-bucket");

await bucket.file(`backups/${filename}`).save(fileContent);
```

### 3. Schedule Backups with GitHub Actions

Use the included GitHub Actions workflow for automated backups:

```yaml
# .github/workflows/database-backup.yml
# Runs daily and uploads to GitHub Artifacts (30-day retention)
```

**Setup:**
1. Add `DATABASE_URL` to GitHub Secrets
2. Backups run automatically daily at 2 AM UTC
3. Download from Actions → Artifacts

### 4. Manual Backup Workflow

For critical operations:

```bash
# Before deployment or major changes
1. Go to Database Management
2. Click "Create Backup"
3. File downloads automatically
4. Save to safe location
5. Proceed with changes
```

## Troubleshooting

### "ENOENT: no such file or directory, mkdir '/var/task/backups'"

**Fixed!** The system now uses `/tmp` directory on serverless platforms.

### Backups Disappear After Deployment

**Expected behavior** on serverless platforms. Always download backups immediately.

### Large Database Backups Fail

Serverless functions have memory and timeout limits:

**Vercel:**
- Free: 1GB memory, 10s timeout
- Pro: 3GB memory, 60s timeout

**Railway:**
- Varies by plan

**Solutions:**
1. Upgrade your plan for larger limits
2. Use CLI tools on a server with more resources
3. Backup specific tables instead of entire database

## Alternative: CLI Backups

For very large databases, use CLI tools directly:

```bash
# On your local machine or a server
npm run backup:db:compress

# Upload to cloud storage
aws s3 cp backups/ s3://your-bucket/backups/ --recursive
```

## Production Recommendations

### Backup Strategy

1. **Automated Daily Backups**: GitHub Actions → Artifacts (30 days)
2. **Weekly Cloud Backups**: Manual upload to S3/GCS (90 days)
3. **Monthly Archives**: Long-term storage (1 year+)
4. **Pre-deployment**: Always backup before changes

### Restore Strategy

1. **Keep Recent Backups Locally**: Last 3-5 backups on your computer
2. **Cloud Storage Access**: Ensure team can access cloud backups
3. **Test Restores**: Periodically test restoration process
4. **Document Process**: Keep restore instructions updated

## Security Notes

- Backup files contain sensitive data
- Encrypt backups before uploading to cloud storage
- Use secure transfer methods (HTTPS, encrypted uploads)
- Limit access to backup files
- Rotate encryption keys regularly

## Cost Considerations

### Storage Costs

**GitHub Artifacts:**
- Free for public repos
- Included in GitHub Actions minutes for private repos
- 30-day retention

**AWS S3:**
- ~$0.023/GB/month (Standard)
- ~$0.004/GB/month (Glacier for archives)

**Google Cloud Storage:**
- ~$0.020/GB/month (Standard)
- ~$0.004/GB/month (Archive)

### Recommendations

- Use GitHub Artifacts for short-term (free)
- Use S3/GCS Standard for recent backups (30-90 days)
- Use S3 Glacier/GCS Archive for long-term (1+ year)

## Summary

✅ **Serverless-friendly features:**
- Automatic download on backup creation
- Upload file for restoration
- Works with `/tmp` directory
- No persistent storage required

⚠️ **Important reminders:**
- Download backups immediately
- Don't rely on server-side storage
- Use cloud storage for production
- Test your restore process

---

**Need help?** Check the main documentation in `docs/database-backup.md`
