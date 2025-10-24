# Password Reset Email Notification

## Overview
When a developer resets a password for a client or admin user, the system now automatically sends an email notification to the user with their new temporary password.

## How It Works

### 1. Developer Resets Password
- Developer logs into the admin panel
- Navigates to the password reset form
- Selects a user (CLIENT or ADMIN role)
- Enters a new password
- Optionally checks "Require password change on next login"

### 2. System Processes Reset
The system performs the following actions:

1. **Logs Plain Text Password** (for developer reference in console):
   ```
   ================================================================================
   PASSWORD RESET - DEVELOPER REFERENCE
   ================================================================================
   User: John Doe
   Email: john@example.com
   Role: CLIENT
   New Password: TempPass123!
   Require Password Change: true
   Reset By: developer@company.com
   Reset At: 2025-10-25T10:30:00.000Z
   ================================================================================
   ```

2. **Sends Email to User** with:
   - User's new temporary password displayed clearly
   - Warning if password change is required on next login
   - Login button/link to access the system
   - Security notice

3. **Hashes Password** and stores it in the database

4. **Logs Activity** for audit trail

### 3. User Receives Email
The user receives a professional email containing:
- Their new temporary password in a highlighted box
- A warning if they need to change it on login
- A direct login link
- Security information

## Email Template
The email uses the RoofCal branded template with:
- Company logo
- Professional styling
- Clear password display
- Security warnings
- Login button

## Development vs Production

### Development Mode
- Emails are logged to the console instead of being sent
- You can see the full email content in the terminal
- No email service configuration needed

### Production Mode
- Emails are sent via configured email service (SMTP/Nodemailer)
- Requires environment variables:
  - `EMAIL_SERVICE=smtp`
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
  - `FROM_EMAIL`

## Security Features
- Plain text password is only logged to server console (not stored)
- Password is immediately hashed before database storage
- Email includes security warnings
- Activity is logged for audit purposes
- Option to require password change on next login

## Usage Example

1. Developer resets password for user@example.com
2. Console shows: "New Password: TempPass123!"
3. Email is sent to user@example.com with the password
4. User logs in with TempPass123!
5. If required, user must change password immediately

## Files Modified
- `src/lib/email.ts` - Added `sendPasswordResetNotificationEmail()` function
- `src/app/api/admin/reset-password/route.ts` - Added email sending logic
