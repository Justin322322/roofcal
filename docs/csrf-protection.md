# CSRF Protection Implementation

## Overview

This document describes the CSRF (Cross-Site Request Forgery) protection implementation for the RoofCal application, specifically for the logout endpoint.

## Security Issue Addressed

The logout endpoint (`/api/auth/logout`) was vulnerable to CSRF attacks because it lacked token validation. This could allow malicious websites to trigger logout requests on behalf of authenticated users without their consent.

## Implementation Details

### 1. CSRF Utility Library (`src/lib/csrf.ts`)

The CSRF utility provides:

- **Token Generation**: Cryptographically secure random token generation
- **Token Signing**: HMAC-based signature creation using NextAuth secret
- **Token Validation**: Secure token verification against stored signatures
- **Cookie Management**: Secure HTTP-only cookie handling for token storage
- **Request Parsing**: Multi-source token extraction (headers, body, cookies)

### 2. CSRF Token Endpoint (`/api/csrf-token`)

- **Purpose**: Provides CSRF tokens to authenticated clients
- **Authentication**: Requires valid session to prevent unauthorized token generation
- **Response**: Returns signed CSRF token for use in subsequent requests

### 3. Protected Logout Endpoint (`/api/auth/logout`)

- **CSRF Validation**: Validates CSRF token before processing logout
- **Error Handling**: Returns 403 Forbidden for invalid/missing CSRF tokens
- **Security Flow**: Only proceeds with logout after successful CSRF validation
- **Cleanup**: Clears CSRF token cookie after successful logout

### 4. Client-Side Integration

The logout dialog (`src/components/auth/logout-dialog.tsx`) now:

- Fetches CSRF token before logout request
- Includes token in both header and request body
- Handles CSRF validation errors appropriately

## Security Features

### Token Security

- **Cryptographically Secure**: Uses Node.js `crypto.randomBytes()` for token generation
- **HMAC Signatures**: Tokens are signed with HMAC-SHA256 using NextAuth secret
- **Secure Storage**: Tokens stored in HTTP-only, secure cookies with SameSite=strict

### Validation Process

1. Extract token from request (header, body, or cookie)
2. Retrieve stored token from secure cookie
3. Verify HMAC signature integrity
4. Compare request token with stored token
5. Reject request if validation fails (403 Forbidden)

### Cookie Configuration

```typescript
{
  httpOnly: true,           // Prevent XSS access
  secure: production,       // HTTPS only in production
  sameSite: "strict",       // Prevent CSRF via cross-site requests
  maxAge: 24 * 60 * 60,    // 24-hour expiration
  path: "/",               // Available site-wide
}
```

## Usage Example

### Client-Side Request Flow

```typescript
// 1. Get CSRF token
const csrfResponse = await fetch("/api/csrf-token", {
  method: "GET",
  credentials: "include",
});
const { csrfToken } = await csrfResponse.json();

// 2. Make protected request
const response = await fetch("/api/auth/logout", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,
  },
  credentials: "include",
  body: JSON.stringify({ csrfToken }),
});
```

### Server-Side Validation

```typescript
// Validate CSRF token before processing
const isValidCSRF = await validateCSRFToken(request);
if (!isValidCSRF) {
  return NextResponse.json(
    { error: "CSRF token validation failed" },
    { status: 403 }
  );
}
```

## Security Benefits

1. **CSRF Attack Prevention**: Malicious sites cannot trigger logout requests
2. **Token Integrity**: HMAC signatures prevent token tampering
3. **Session Binding**: Tokens are tied to user sessions
4. **Automatic Cleanup**: Tokens are cleared after logout
5. **Multi-Source Validation**: Supports header, body, and cookie token sources

## Configuration

The CSRF implementation uses the existing NextAuth secret (`NEXTAUTH_SECRET`) for token signing. Ensure this environment variable is properly configured:

```env
NEXTAUTH_SECRET=your-secure-secret-here
```

## Error Handling

- **403 Forbidden**: Invalid or missing CSRF token
- **401 Unauthorized**: No active session
- **500 Internal Server Error**: Server-side errors during validation

## Future Enhancements

Consider implementing:

- Token rotation for enhanced security
- Rate limiting for CSRF token requests
- Additional validation for request origin
- Logging of CSRF validation failures for monitoring
