# Run Production Migration Guide

## Problem
The production database on Vercel is missing the `notification` table, causing 500 errors.

## Solution Options

### Option 1: Trigger a New Deployment (Recommended)
The easiest way to apply the migration is to trigger a new deployment to Vercel:

1. **Make a small change to trigger deployment:**
   ```bash
   git commit --allow-empty -m "Trigger deployment to apply database migrations"
   git push origin main
   ```

2. **Monitor the deployment:**
   - Go to your Vercel dashboard
   - Watch the deployment logs
   - The build script includes `prisma migrate deploy` which will apply all pending migrations

3. **Verify the migration:**
   - After deployment completes, visit `https://roofcal.vercel.app/api/notifications`
   - The 500 error should be resolved

### Option 2: Run Migration Manually (If Option 1 doesn't work)

If the automatic migration doesn't work during deployment, you can run it manually:

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Pull Environment Variables
```bash
vercel env pull .env.production
```

#### Step 4: Run the Migration
```bash
npx prisma migrate deploy
```

#### Step 5: Verify the Migration
```bash
npx prisma migrate status
```

### Option 3: Use Vercel CLI Directly

If you have the production DATABASE_URL, you can run:

```bash
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

## Verification

After running the migration, verify it worked:

1. **Check the API:**
   ```bash
   curl https://roofcal.vercel.app/api/notifications
   ```
   Should return 401 (not authenticated) instead of 500 (server error)

2. **Check the database:**
   ```bash
   npx prisma studio
   ```
   Navigate to the `notification` table and verify it exists

3. **Test in the app:**
   - Log in to the production app
   - Check that the notification center loads without errors
   - The notification bell icon should work properly

## Expected Migration Output

When the migration runs successfully, you should see:
```
Environment variables loaded from .env.production
Prisma schema loaded from prisma\schema.prisma
Datasource "db": MySQL database at [your-database-url]

11 migrations found in prisma/migrations

The following migrations have been applied:

migrations/
  └─ 20251010084833_init/
  └─ 20251011035656_add_projects_table/
  └─ 20251012032100_add_delivery_location_fields/
  └─ 20251012083322_add_pricing_config/
  └─ 20251012124450_add_warehouse_materials/
  └─ 20251013014946_add_material_consumption_system/
  └─ 20251013021427_add_completed_proposal_status/
  └─ 20251013025323_add_notifications_table/  ← This is the missing one
  └─ 20251013085630_add_board_and_proposal_positions/
  └─ 20251013110000_add_project_stage_fields/
  └─ 20251014001417_add_developer_role_and_maintenance/

All migrations have been successfully applied.
```

## Troubleshooting

### If migration fails with "table already exists"
The table might have been partially created. You can:
1. Drop the table manually: `DROP TABLE Notification;`
2. Re-run the migration

### If migration fails with connection error
1. Verify the DATABASE_URL is correct
2. Check that the database is accessible from your network
3. Ensure the database user has proper permissions

### If you need to rollback
```bash
npx prisma migrate resolve --rolled-back 20251013025323_add_notifications_table
```

## Next Steps

After the migration is successful:
1. Monitor the application logs for any remaining errors
2. Test all notification-related features
3. Verify the notification center works properly
4. Check that new notifications are being created correctly

