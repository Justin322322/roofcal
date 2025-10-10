# Environment Variables Configuration

## Overview

This document describes all the environment variables required for the RoofCal application. Copy the configuration below to a `.env.local` file and fill in your actual values.

## Required Environment Variables

### Database Configuration

```bash
# MySQL database connection string for Prisma
# For local development
DATABASE_URL="mysql://username:password@localhost:3306/roofcalc_db"

# For Railway deployment
# Copy the MySQL URL from your Railway project's Variables tab
DATABASE_URL="mysql://root:password@containers-us-west-xxx.railway.app:xxxx/railway"
```

### NextAuth.js Configuration

```bash
# Secret key for NextAuth.js JWT tokens and session encryption
NEXTAUTH_SECRET="your-super-secret-nextauth-key-here"

# Base URL for your application (used for redirects and callbacks)
NEXTAUTH_URL="http://localhost:3000"
```

### SMTP Email Configuration

```bash
# SMTP server configuration for sending verification and password reset emails
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"
```

### Application Environment

```bash
# Node.js environment
NODE_ENV="development"
```

## Complete .env.local File Template

Create a `.env.local` file in your project root with the following content:

```bash
# =============================================================================
# RoofCal - Professional Roof Calculator
# Environment Variables Configuration
# =============================================================================

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL="mysql://username:password@localhost:3306/roofcalc_db"

# =============================================================================
# NEXT-AUTH CONFIGURATION
# =============================================================================
NEXTAUTH_SECRET="your-super-secret-nextauth-key-here"
NEXTAUTH_URL="http://localhost:3000"

# =============================================================================
# SMTP EMAIL CONFIGURATION
# =============================================================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# =============================================================================
# APPLICATION ENVIRONMENT
# =============================================================================
NODE_ENV="development"
```

## Setup Instructions

### Local Development Setup

1. **Copy the template**: Create a `.env.local` file in your project root
2. **Database Setup**: Update `DATABASE_URL` with your local MySQL database credentials
3. **Generate Secret**: Create a secure `NEXTAUTH_SECRET` using:
   ```bash
   openssl rand -base64 32
   ```
4. **Email Configuration**: Set up SMTP credentials for email functionality
5. **URL Configuration**: Set `NEXTAUTH_URL` to your local application URL
6. **Database Migration**: Run database migrations:
   ```bash
   npm run prisma:migrate
   ```
7. **Start Application**: Launch the development server:
   ```bash
   npm run dev
   ```

### Railway Deployment Setup

1. **Create Railway Project**: Set up your project on Railway
2. **Add MySQL Service**: Add a MySQL database service to your Railway project
3. **Copy Database URL**: Railway automatically provides `DATABASE_URL` in your project variables
4. **Set Environment Variables**: In Railway dashboard, add:
   - `NEXTAUTH_SECRET`: Generate a secure secret key
   - `NEXTAUTH_URL`: Your Railway app URL (e.g., `https://your-app-name.railway.app`)
   - SMTP credentials for email functionality
5. **Deploy**: Railway will automatically run migrations and deploy your application

## Environment Variables Details

### DATABASE_URL

- **Purpose**: MySQL connection string for Prisma ORM
- **Format**: `mysql://username:password@host:port/database_name`
- **Local Example**: `mysql://root:password123@localhost:3306/roofcalc_dev`
- **Railway Example**: `mysql://root:password@containers-us-west-xxx.railway.app:xxxx/railway`
- **Railway Setup**:
  1. Create a MySQL database in your Railway project
  2. Copy the MySQL URL from the Variables tab in your Railway dashboard
  3. The URL will be automatically provided in the format above

### NEXTAUTH_SECRET

- **Purpose**: Secret key for JWT token signing and session encryption
- **Requirements**: Minimum 32 characters, cryptographically secure
- **Generation**: Use `openssl rand -base64 32` or similar tools

### NEXTAUTH_URL

- **Purpose**: Base URL for authentication callbacks and redirects
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

### SMTP Configuration

- **SMTP_HOST**: Email server hostname (default: smtp.gmail.com)
- **SMTP_PORT**: Email server port (587 for TLS, 465 for SSL)
- **SMTP_USER**: Email account username
- **SMTP_PASSWORD**: Email account password or app-specific password
- **SMTP_FROM**: From email address (defaults to SMTP_USER if not set)

## Security Best Practices

- ✅ Keep all secrets secure and never commit them to version control
- ✅ Use strong, unique passwords for database and SMTP
- ✅ Enable 2FA on your email account when using SMTP
- ✅ Use environment-specific values (different for dev/staging/prod)
- ✅ Regularly rotate secrets, especially in production
- ✅ Use app-specific passwords for Gmail instead of your main password

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format and credentials
   - Ensure MySQL server is running
   - Check network connectivity

2. **Email Sending Issues**
   - Verify SMTP credentials
   - Check if 2FA is enabled (use app passwords for Gmail)
   - Ensure SMTP server allows connections from your IP

3. **Authentication Errors**
   - Verify NEXTAUTH_SECRET is set and secure
   - Check NEXTAUTH_URL matches your application URL
   - Ensure all required environment variables are loaded

### Development vs Production

- **Development**: Use local MySQL database and development email service
- **Production**: Use Railway MySQL database, proper SMTP service, and secure secrets
- **Railway Deployment**:
  - Railway automatically provides DATABASE_URL when you add a MySQL service
  - Set NEXTAUTH_URL to your Railway app URL (e.g., `https://your-app-name.railway.app`)
  - Use production SMTP credentials for email functionality
- **Staging**: Use separate environment variables for testing

## Additional Configuration

For production deployments, consider adding:

```bash
# Optional: External Services
ANALYTICS_ID="your-analytics-id"
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
SENTRY_DSN="https://..."

# Optional: Redis for session storage
REDIS_URL="redis://localhost:6379"
```

## Support

If you encounter issues with environment configuration, check:

1. All required variables are set
2. Values are properly formatted
3. Services (database, SMTP) are accessible
4. File permissions are correct (.env.local should be readable)
