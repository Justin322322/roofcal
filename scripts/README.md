# Database Migration Helper Scripts

This directory contains helper scripts to manually apply database migrations if the automatic migration during deployment fails.

## Problem

The `ProjectMaterial` table might not exist in the Railway production database even though the migration file exists. This can happen if:
- The migration failed silently during deployment
- The migration was skipped due to an error
- The database connection was interrupted during migration

## Solution Options

### Option 1: Run Migration Script via Railway CLI (Recommended)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run the migration script:
   ```bash
   railway run npm run prisma:fix-projectmaterial
   ```

### Option 2: Manual SQL Execution via Railway Dashboard

1. Go to your Railway project dashboard
2. Navigate to your MySQL database service
3. Open the "Data" tab or "Query" tab
4. Copy and paste the contents of `scripts/ensure-projectmaterial-table.sql`
5. Execute the SQL

### Option 3: Connect via MySQL Client

1. Get your database connection string from Railway
2. Connect using MySQL client:
   ```bash
   mysql -h <host> -P <port> -u <user> -p
   ```
3. Copy and paste the contents of `scripts/ensure-projectmaterial-table.sql`
4. Execute

### Option 4: Force Migration via Railway Shell

1. Open Railway shell:
   ```bash
   railway shell
   ```

2. Run the migration:
   ```bash
   npm run prisma:fix-projectmaterial
   ```

## Verification

After applying the migration, verify it worked by:

1. Check the logs for success message
2. Try using the Smart Stock Planning feature
3. Check that no "ProjectMaterial table does not exist" errors appear

## Troubleshooting

### Error: "Table already exists"
- This is fine! It means the table was already created
- The script will skip creation and continue

### Error: "Foreign key constraint failed"
- The referenced tables (`project` or `WarehouseMaterial`) might not exist
- Ensure all previous migrations have been applied

### Error: "Connection refused"
- Check your Railway database credentials
- Verify the database service is running
- Check your firewall/network settings

## Files

- `ensure-projectmaterial-table.sql` - SQL script to create the table
- `apply-projectmaterial-migration.ts` - TypeScript script to programmatically apply migration
- `README.md` - This file

## Support

If you continue to have issues:
1. Check Railway deployment logs for migration errors
2. Verify all migrations in `prisma/migrations` are present
3. Contact Railway support if the database service is having issues

