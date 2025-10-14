# Admin Creation Module Test Guide

This guide provides step-by-step instructions to test the admin creation module.

## Prerequisites

1. Database server running
2. Application running in development mode
3. At least one DEVELOPER user account

## Test Scenarios

### Scenario 1: Create Admin Account (Developer)

**Objective**: Verify that developers can create admin accounts

**Steps**:
1. Login as a DEVELOPER user
2. Navigate to Dashboard → System Control → Admin Management
3. Fill out the admin creation form:
   - Email: `test-admin@example.com`
   - First Name: `Test`
   - Last Name: `Admin`
   - Password: `TempPassword123!`
4. Click "Create Admin Account"
5. Verify success message appears
6. Check that form resets

**Expected Result**: 
- Success message displayed
- Form fields cleared
- Admin account created in database with `passwordChangeRequired: true`

### Scenario 2: First Admin Login (Forced Password Change)

**Objective**: Verify forced password change on first login

**Steps**:
1. Logout from developer account
2. Login with new admin credentials:
   - Email: `test-admin@example.com`
   - Password: `TempPassword123!`
3. Verify redirect to `/dashboard/change-password`
4. Fill out password change form:
   - Current Password: `TempPassword123!`
   - New Password: `NewSecurePassword123!`
   - Confirm Password: `NewSecurePassword123!`
5. Click "Update Password"
6. Verify success message
7. Verify redirect to dashboard

**Expected Result**:
- Automatic redirect to password change page
- Cannot access other dashboard sections
- Successful password change
- Redirect to dashboard after completion
- `passwordChangeRequired` flag set to `false` in database

### Scenario 3: Admin Access Control

**Objective**: Verify admin can access admin-only features

**Steps**:
1. With changed password, verify access to:
   - Account Management
   - System Maintenance
   - Warehouse Management
2. Verify admin CANNOT access:
   - Database Management
   - System Control

**Expected Result**:
- Admin can access admin-level features
- Admin cannot access developer-only features

### Scenario 4: Permission Validation

**Objective**: Verify only developers can create admin accounts

**Steps**:
1. Login as ADMIN user
2. Try to navigate to `/dashboard/system-control/admin-management`
3. Verify access is denied
4. Login as CLIENT user
5. Try to navigate to `/dashboard/system-control/admin-management`
6. Verify access is denied

**Expected Result**:
- Only DEVELOPER users can access admin creation
- Other roles are redirected or denied access

### Scenario 5: API Security

**Objective**: Verify API endpoints are properly secured

**Steps**:
1. Without authentication, try to POST to `/api/admin/create-admin`
2. Verify 401 Unauthorized response
3. With ADMIN role, try to POST to `/api/admin/create-admin`
4. Verify 403 Forbidden response (if implemented)

**Expected Result**:
- API endpoints properly validate authentication
- API endpoints properly validate authorization

## Database Verification

### Check Admin Creation

```sql
SELECT id, email, firstName, lastName, role, passwordChangeRequired, created_at 
FROM user 
WHERE email = 'test-admin@example.com';
```

**Expected**: Record exists with `passwordChangeRequired: true`

### Check Password Change

```sql
SELECT id, email, passwordChangeRequired, updated_at 
FROM user 
WHERE email = 'test-admin@example.com';
```

**Expected**: `passwordChangeRequired: false` after password change

### Check Activity Logs

```sql
SELECT type, description, created_at 
FROM activity 
WHERE userId = (SELECT id FROM user WHERE email = 'test-admin@example.com')
ORDER BY created_at DESC;
```

**Expected**: 
- "ACCOUNT_CREATED" entry
- "PASSWORD_CHANGE" entry

## Common Issues & Solutions

### Issue: Migration Fails
**Solution**: 
- Ensure database is running
- Check database connection string
- Run: `npx prisma migrate reset` (development only)

### Issue: Permission Denied
**Solution**:
- Verify user has DEVELOPER role
- Check session is valid
- Clear browser cookies/cache

### Issue: Infinite Redirect Loop
**Solution**:
- Check `passwordChangeRequired` flag in database
- Verify JWT token updates properly
- Check middleware configuration

### Issue: Form Validation Errors
**Solution**:
- Check password meets requirements (8+ chars, complexity)
- Verify email format
- Check required fields are filled

## Performance Testing

### Load Testing (Optional)

1. Create multiple admin accounts rapidly
2. Verify system handles concurrent requests
3. Check database performance
4. Monitor memory usage

### Security Testing

1. Try SQL injection in form fields
2. Test XSS in form inputs
3. Verify CSRF protection
4. Check password hashing strength

## Cleanup

After testing, clean up test data:

```sql
DELETE FROM activity WHERE userId IN (
  SELECT id FROM user WHERE email = 'test-admin@example.com'
);

DELETE FROM user WHERE email = 'test-admin@example.com';
```

## Success Criteria

✅ Admin creation works for developers only
✅ Forced password change on first login
✅ Proper access control and permissions
✅ Database updates correctly
✅ Activity logging works
✅ UI/UX is intuitive and secure
✅ Error handling is comprehensive
✅ Security measures are effective

## Notes

- Test in development environment only
- Use strong, unique passwords for testing
- Document any issues found during testing
- Consider automated testing for CI/CD pipeline
