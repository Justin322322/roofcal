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

- Client: Default role for personal projects and estimates.
- Admin: Manually promoted by system administrators for professional use and management.

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
- Verified accounts can sign in.

```mermaid
sequenceDiagram
  participant You as You
  participant App as App
  You->>App: Login (email + password)
  App-->>You: Signed in
```

## Password reset

- Forgot your password? Get a 6-digit code, then set a new password.

```mermaid
sequenceDiagram
  participant You as You
  participant App as App
  participant Mail as Email
  You->>App: Forgot password
  App-->>Mail: Send reset code
  Mail-->>You: Reset code arrives
  You->>App: Enter code + new password
  App-->>You: Password updated
```
