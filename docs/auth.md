# Auth flow (simple overview)

## Signup (Registration)

- Enter your name, email, and password.
- We send a 6-digit code to your email.
- All users start as clients by default.

```mermaid
sequenceDiagram
  participant You as You
  participant App as App
  participant Mail as Email
  You->>App: Sign up (name, email, password)
  App-->>Mail: Send 6-digit code
  Mail-->>You: Code arrives in inbox
```

### Account types

- **Client**: Default role for personal projects and estimates.
- **Admin**: Manually promoted by system administrators for professional use and management.

### Role-based access

- **Client users** can access: Roof Calculator, Manual Calculator, Contractor Calculator, AI Recommendations, Archive, Project Management, Cost Customization
- **Admin users** have access to all client features plus: Account Management (user administration, billing, subscriptions)
- Account Management section is protected and only accessible to admin users

## Verify code

- You enter the code.
- Your email becomes verified.

```mermaid
sequenceDiagram
  participant You as You
  participant App as App
  You->>App: Enter 6-digit code
  App-->>You: Email verified
```

## Resend code

- If the code expired or you didn’t get it, request a new one.

```mermaid
sequenceDiagram
  participant You as You
  participant App as App
  participant Mail as Email
  You->>App: Resend code
  App-->>Mail: Send new 6-digit code
  Mail-->>You: New code arrives
```

## Login

- Use your email and password.
- You can sign in even if your email is not verified.
- **Unverified users** will be redirected to the verification page.
- **Verified users** will go directly to the dashboard.

```mermaid
sequenceDiagram
  participant You as You
  participant App as App
  participant Verify as Verify Page
  participant Dashboard as Dashboard
  You->>App: Login (email + password)
  App->>App: Authenticate user
  App->>App: Check email verification
  alt Email verified
    App-->>Dashboard: Redirect to dashboard
  else Email not verified
    App-->>Verify: Redirect to verification page
    You->>Verify: Enter 6-digit code
    Verify->>App: Verify code
    App-->>Dashboard: Redirect to dashboard
  end
```

## Password reset

- Forgot your password? Get a 6-digit code, then set a new password.
- **Security**: The reset code must be entered to change your password.

```mermaid
sequenceDiagram
  participant You as You
  participant App as App
  participant Mail as Email
  You->>App: Forgot password
  App-->>Mail: Send reset code
  Mail-->>You: Reset code arrives
  You->>App: Enter code + new password
  App->>App: Verify reset code
  alt Code valid
    App-->>You: Password updated
  else Code invalid/expired
    App-->>You: "Invalid or expired reset code"
  end
```
