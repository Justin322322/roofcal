# Admin Creation Flow Test

This document outlines how to test the admin creation functionality for developer users.

## Prerequisites

1. Ensure you have a user with DEVELOPER role in the database
2. Email service should be configured (check .env.local)
3. Database should be running and accessible

## Test Steps

### 1. Login as Developer User

1. Navigate to `/login`
2. Login with a user that has DEVELOPER role
3. Verify you can access the admin management page

### 2. Access Admin Management

1. Navigate to `/dashboard/system-control/admin-management`
2. Verify the CreateAdminForm is displayed
3. Check that the form shows the email notification message

### 3. Create Admin Account

1. Fill out the form with:
   - First Name: Test
   - Last Name: Admin
   - Email: testadmin@example.com
   - Password: TestPassword123!
2. Submit the form
3. Verify success message appears
4. Check that form is reset

### 4. Verify Database Entry

1. Check the database for the new admin user
2. Verify `passwordChangeRequired` is set to `true`
3. Verify role is set to `ADMIN`
4. Check activity log entry

### 5. Check Email Sending

1. Check console logs for email output (development mode)
2. Verify email contains:
   - Admin credentials
   - Security warning about password change
   - Login URL
   - Admin capabilities list

### 6. Test Admin Login

1. Logout from developer account
2. Login with the new admin credentials
3. Verify password change is required
4. Complete password change flow

## Expected Results

- ✅ Only DEVELOPER role users can create admin accounts
- ✅ Admin accounts are created with `passwordChangeRequired: true`
- ✅ Credentials are sent via email
- ✅ Activity is logged in database
- ✅ Admin must change password on first login
- ✅ Proper error handling for validation and permissions

## Error Scenarios to Test

1. **Non-developer user tries to create admin**: Should get 403 error
2. **Invalid email format**: Should show validation error
3. **Weak password**: Should show password strength error
4. **Duplicate email**: Should show "user already exists" error
5. **Missing required fields**: Should show field validation errors

## API Testing with curl

```bash
# Test with valid developer session
curl -X POST http://localhost:3000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "email": "testadmin@example.com",
    "firstName": "Test",
    "lastName": "Admin", 
    "password": "TestPassword123!"
  }'

# Expected response (201):
{
  "message": "Admin account created successfully. Credentials have been sent to the admin's email.",
  "admin": {
    "id": "uuid",
    "email": "testadmin@example.com",
    "firstName": "Test",
    "lastName": "Admin",
    "role": "ADMIN"
  }
}
```

## Security Considerations

- ✅ Passwords are properly hashed before storage
- ✅ Temporary passwords are sent securely via email
- ✅ Admin must change password on first login
- ✅ All admin creation activities are logged
- ✅ Only DEVELOPER role can create admin accounts
- ✅ Form validation prevents invalid data submission
