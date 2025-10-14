# Admin Account Creation Module

This module provides a secure way for developers to create admin accounts with forced password change on first login.

## Features

- **Developer-only admin creation**: Only users with DEVELOPER role can create admin accounts
- **Automatic credential emailing**: Admin credentials are automatically sent via email
- **Forced password change**: Admins must change their password on first login
- **Secure password handling**: Passwords are properly hashed and validated
- **Activity logging**: All admin creation activities are logged
- **Professional email templates**: Beautiful HTML email templates with security warnings
- **Type-safe implementation**: Full TypeScript support with proper type definitions

## Components

### 1. Database Schema

The `user` table includes a new field:
```sql
passwordChangeRequired BOOLEAN DEFAULT false
```

### 2. API Routes

#### Create Admin Account
- **Endpoint**: `POST /api/admin/create-admin`
- **Authentication**: Requires valid session
- **Authorization**: Only DEVELOPER role
- **Body**:
  ```json
  {
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "password": "temporaryPassword123"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Admin account created successfully. Credentials have been sent to the admin's email.",
    "admin": {
      "id": "uuid",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN"
    }
  }
  ```

#### Change Password
- **Endpoint**: `POST /api/auth/change-password`
- **Authentication**: Requires valid session
- **Body**:
  ```json
  {
    "currentPassword": "currentPassword",
    "newPassword": "newSecurePassword123"
  }
  ```

### 3. UI Components

#### CreateAdminForm
- Location: `src/components/admin/create-admin-form.tsx`
- Features:
  - Form validation with Zod
  - Password strength indicator
  - Real-time feedback
  - Success/error handling
  - Email notification confirmation

#### ForcePasswordChangeForm
- Location: `src/components/auth/force-password-change-form.tsx`
- Features:
  - Required for first-time admin login
  - Password strength validation
  - Automatic redirect after success

### 4. Pages

#### Admin Management Page
- Location: `src/app/dashboard/system-control/admin-management/page.tsx`
- Access: DEVELOPER role only
- Features: Admin creation form

#### Password Change Page
- Location: `src/app/dashboard/change-password/page.tsx`

### 5. Email System

#### Admin Credentials Email
- **Function**: `sendAdminCredentialsEmail()` in `src/lib/email.ts`
- **Features**:
  - Professional HTML email template
  - Plain text fallback
  - Security warnings and instructions
  - Admin capabilities overview
  - Login URL with branding
- **Template includes**:
  - Welcome message with admin name
  - Login credentials (email and temporary password)
  - Security warning about password change requirement
  - List of admin capabilities
  - Direct login button
  - Professional styling and branding

## Security Features

### 1. Middleware Protection
The middleware automatically redirects users with `passwordChangeRequired: true` to the password change page before accessing any dashboard functionality.

### 2. Password Validation
- Minimum 8 characters
- Strength validation using the existing password validator
- Confirmation matching

### 3. Session Management
- JWT tokens include `passwordChangeRequired` flag
- Session updates when password is changed
- Automatic redirect after password change

### 4. Activity Logging
All admin creation and password change activities are logged with:
- User ID
- Timestamp
- Action type
- Metadata

## Usage

### For Developers

1. **Access Admin Management**:
   - Login as a DEVELOPER user
   - Navigate to System Control → Admin Management
   - Fill out the admin creation form

2. **Create Admin Account**:
   - Enter admin details (name, email, temporary password)
   - Submit the form
   - Admin will receive the temporary password securely

### For New Admins

1. **First Login**:
   - Login with provided temporary credentials
   - System redirects to password change page
   - Cannot access dashboard until password is changed

2. **Change Password**:
   - Enter current temporary password
   - Enter new secure password
   - Confirm new password
   - Redirected to dashboard upon success

## Database Migration

To add the required field to your database:

```bash
npx prisma migrate dev --name add_password_change_required
```

This adds the `passwordChangeRequired` field to the `user` table.

## Script Usage

For command-line admin creation (development only):

```bash
node scripts/create-admin.js
```

**Note**: This script is for development purposes only. Use the web interface for production.

## Configuration

### Environment Variables
No additional environment variables are required. The module uses existing authentication configuration.

### Type Definitions
The module extends NextAuth types to include `passwordChangeRequired`:

```typescript
interface Session {
  user: {
    // ... existing fields
    passwordChangeRequired: boolean;
  };
}
```

## Error Handling

The module includes comprehensive error handling for:
- Invalid form data
- Database connection issues
- Permission violations
- Password validation failures
- Session management errors

## Testing

### Manual Testing Steps

1. **Create Admin Account**:
   - Login as DEVELOPER
   - Navigate to System Control → Admin Management
   - Create new admin account
   - Verify success message

2. **Test Forced Password Change**:
   - Login with new admin credentials
   - Verify redirect to password change page
   - Change password successfully
   - Verify redirect to dashboard

3. **Verify Security**:
   - Try accessing dashboard before password change
   - Verify middleware redirects work
   - Test with invalid credentials

## Security Considerations

1. **Developer Access**: Only DEVELOPER role can create admin accounts
2. **Password Security**: All passwords are hashed with bcrypt (rounds: 12)
3. **Session Security**: JWT tokens include security flags
4. **Activity Logging**: All admin actions are logged for audit
5. **Input Validation**: All inputs are validated and sanitized

## Future Enhancements

Potential improvements for future versions:
- Email notifications for admin creation
- Bulk admin creation
- Admin account management (edit, deactivate)
- Password policy enforcement
- Two-factor authentication integration
- Admin role hierarchy

## Troubleshooting

### Common Issues

1. **Migration Fails**:
   - Ensure database is running
   - Check database connection
   - Verify Prisma schema

2. **Permission Denied**:
   - Verify user has DEVELOPER role
   - Check session validity
   - Ensure proper authentication

3. **Password Change Loop**:
   - Check `passwordChangeRequired` flag in database
   - Verify JWT token updates
   - Clear browser session if needed

### Debug Steps

1. Check database for `passwordChangeRequired` field
2. Verify JWT token contents
3. Check middleware logs
4. Validate API responses
5. Test with different user roles
