# RoofCalc - Professional Roofing Estimation & Project Management System

> A comprehensive roofing cost estimation and project management platform with warehouse management, material tracking, and intelligent decision-making capabilities.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [User Roles & Access Control](#user-roles--access-control)
- [Core System Modules](#core-system-modules)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Key Features](#key-features)
- [User Journeys](#user-journeys)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

---

## Overview

**RoofCalc** is an intelligent roofing cost estimation and project management system designed for residential construction projects. It provides accurate cost estimates, complexity analysis, material management, and complete project lifecycle tracking.

### Key Capabilities

- **Intelligent Roof Calculator**: AI-powered cost estimation with decision tree algorithms
- **Project Management**: Complete workflow from draft to completion
- **Role-Based Access**: Secure access control for Clients, Admins, and Developers
- **User Account Management**: Complete user lifecycle management with enable/disable functionality
- **Real-Time Notifications**: Instant alerts for project updates and system events
- **Dark Mode Support**: Complete light/dark theme system with system preference detection

### Technology Stack

- **Frontend**: Next.js 15.5.4, React 19, TypeScript
- **UI Components**: Shadcn UI, Radix UI, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: MySQL with Prisma ORM
- **External Services**: Nodemailer (email)
- **State Management**: React Hooks, nuqs (URL state)
- **Authentication**: JWT-based with email verification
- **Theme Management**: next-themes with system preference detection

---

## System Architecture

```mermaid
flowchart TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Browser]
    end

    subgraph "Application Layer"
        NEXT[Next.js Application]
        AUTH[Authentication Module]
        CALC[Roof Calculator]
        PROJ[Project Management]
        NOTIF[Notification System]
        TUTORIAL[Tutorial System]
    end

    subgraph "Data Layer"
        DB[(MySQL Database)]
        PRISMA[Prisma ORM]
    end

    subgraph "External Services"
        EMAIL[Email Service<br/>Nodemailer]
    end

    WEB --> NEXT
    MOBILE --> NEXT
    
    NEXT --> AUTH
    NEXT --> CALC
    NEXT --> PROJ
    NEXT --> NOTIF
    NEXT --> TUTORIAL
    
    AUTH --> PRISMA
    CALC --> PRISMA
    PROJ --> PRISMA
    NOTIF --> PRISMA
    
    PRISMA --> DB
    
    AUTH --> EMAIL
    PROJ --> EMAIL
    NOTIF --> EMAIL
    

    style NEXT fill:#000,stroke:#fff,stroke-width:3px,color:#fff
    style DB fill:#4472C4,stroke:#fff,stroke-width:2px,color:#fff
    style PRISMA fill:#2D3748,stroke:#fff,stroke-width:2px,color:#fff
```

---

## User Roles & Access Control

### 1. CLIENT Role

**Default role for all new users**

**Access:**
- Roof Calculator (create estimates)
- Manual Calculator
- Contractor Calculator
- AI Recommendations
- Project Management (own projects)
- View proposals
- Accept/Reject proposals
- Archive projects
- Cost Customization
- Tutorial Guide (interactive help system)

**Restrictions:**
- Cannot access account management
- Cannot manage warehouses
- Cannot view other users' projects
- Cannot access system controls

### 2. ADMIN Role

**Manually promoted by system administrators**

**Access:**
- All CLIENT features
- Account Management (user administration)
- Contractor Functions
- Project Assignment
- Proposal Creation
- System Settings
- Tutorial Guide access

**Additional Capabilities:**
- Review client projects
- Create and send proposals
- Assign contractors
- Configure system settings
- View all projects
- Manage user accounts (enable/disable users)
- Monitor user activity and access

### 3. DEVELOPER Role

**Highest level access for system maintenance**

**Access:**
- All ADMIN features
- Database Management
- System Control Panel
- Maintenance Mode
- System Logs
- Advanced Configuration
- Admin Management (create admin accounts)
- Complete user account control (enable/disable/delete)
- Tutorial Guide access

---

## Core System Modules

### A. Authentication System

Secure authentication with email verification and role-based access control.

#### Features

- **Signup**: Email, password, name with 6-digit verification code
- **Login**: Email/password with session management
- **Email Verification**: 6-digit code sent via email
- **Password Reset**: Secure reset flow with verification code
- **Rate Limiting**: Protection against brute force attacks
- **Session Management**: JWT-based with NextAuth.js
- **Role-Based Redirect**: Automatic routing based on user role
- **Password Change Required**: Force password change on first login for admin-created accounts

#### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant API as API Routes
    participant DB as Database
    participant EMAIL as Email Service

    Note over U,EMAIL: Signup Flow
    U->>UI: Enter signup details
    UI->>API: POST /api/auth/signup
    API->>DB: Create user (unverified)
    API->>DB: Generate 6-digit code
    API->>EMAIL: Send verification code
    EMAIL->>U: Email with code
    U->>UI: Enter verification code
    UI->>API: POST /api/auth/verify-code
    API->>DB: Verify code
    API->>DB: Mark email as verified
    API->>UI: Success - redirect to dashboard
    
    Note over U,EMAIL: Login Flow
    U->>UI: Enter credentials
    UI->>API: POST /api/auth/login
    API->>DB: Validate credentials
    alt Email verified
        API->>UI: Create session
        UI->>U: Redirect to dashboard
    else Email not verified
        API->>UI: Redirect to verification
    end
    
    Note over U,EMAIL: Password Reset
    U->>UI: Request password reset
    UI->>API: POST /api/auth/request-reset
    API->>DB: Generate reset code
    API->>EMAIL: Send reset code
    EMAIL->>U: Email with reset code
    U->>UI: Enter code + new password
    UI->>API: POST /api/auth/reset-password
    API->>DB: Verify code & update password
    API->>UI: Success - redirect to login
```

---

### B. User Account Management System

Comprehensive user lifecycle management with administrative controls and security features.

#### Features

- **Account Status Control**: Enable/disable user accounts with immediate effect
- **Administrative Actions**: Admins and Developers can manage user accounts
- **Security Enforcement**: Disabled users are immediately logged out and blocked from access
- **Activity Logging**: All account management actions are logged for audit trails
- **Session Invalidation**: Disabled accounts have their sessions immediately terminated
- **Role-Based Management**: Only ADMIN and DEVELOPER roles can manage user accounts

#### Account Management Flow

```mermaid
sequenceDiagram
    participant A as Admin/Developer
    participant UI as Account Management UI
    participant API as API Routes
    participant DB as Database
    participant M as Middleware
    participant U as User

    Note over A,U: Disable Account Flow
    A->>UI: Click "Disable Account"
    UI->>API: POST /api/accounts/[id]/disable
    API->>DB: Update user.isDisabled = true
    API->>DB: Log disable action
    API->>UI: Success response
    UI->>A: Show success message
    
    Note over A,U: Security Enforcement
    U->>M: Try to access dashboard
    M->>DB: Check user.isDisabled status
    DB->>M: User is disabled
    M->>U: Redirect to login with error
    U->>U: Session invalidated
    
    Note over A,U: Enable Account Flow
    A->>UI: Click "Enable Account"
    UI->>API: POST /api/accounts/[id]/enable
    API->>DB: Update user.isDisabled = false
    API->>DB: Log enable action
    API->>UI: Success response
    UI->>A: Show success message
    U->>U: Can now log in again
```

#### Account Status Management

- **Active**: User can log in and access all permitted features
- **Disabled**: User is blocked from login and all system access
- **Automatic Logout**: Disabled users are immediately logged out on next request
- **Session Invalidation**: All existing sessions for disabled users are terminated

#### Security Features

- **Middleware Protection**: Real-time checking of user status on dashboard access
- **JWT Validation**: Session tokens are invalidated for disabled users
- **Authentication Blocking**: Disabled users cannot authenticate even with correct credentials
- **Activity Tracking**: All enable/disable actions are logged with timestamps and admin details

#### Administrative Controls

- **Account Management UI**: Visual interface for managing user accounts
- **Bulk Operations**: Support for multiple account management actions
- **Status Indicators**: Clear visual indicators of account status (Active/Disabled)
- **Audit Trail**: Complete history of account management actions

---

### C. Roof Calculator Module

Intelligent roofing cost estimation with decision tree algorithms and complexity analysis.

#### Features

- **Simplified Area Calculation**: Direct width × length (no pitch factor)
- **Material Selection**: 6 materials (Asphalt, Wood, Metal, Clay Tiles, Slate)
- **Construction Mode**: New (40% labor) vs Repair (20% labor + 10% removal)
- **Budget Validation**: Real-time budget checking with smart alerts
- **Gutter Calculator**: A-B-C formula with automatic piece calculation
- **Ridge System**: Auto-matched to roof material
- **Insulation**: 100% coverage with thickness selection
- **Ventilation**: Smart recommendations based on roof area
- **Decision Tree**: Intelligent material recommendations
- **Complexity Scoring**: 1-10 scale with detailed factor analysis
- **Optimization Engine**: Auto-adjust settings to reduce complexity

#### Calculation Formulas

```javascript
// Area Calculation
totalArea = length × width

// Material Costs
roofMaterialCost = totalArea × pricePerSqm
gutterPieces = Math.ceil(((gutterA + gutterB + gutterC) × 2) / 2.3)
gutterCost = gutterPieces × gutterPricePerPiece
ridgeCost = length × ridgePricePerMeter
screwsCost = totalArea × screwsPricePerSqm
insulationCost = totalArea × insulationPricePerSqm
ventilationCost = ventilationPieces × 850

// Labor Costs
if (constructionMode === "new") {
    laborCost = totalMaterialsCost × 0.4
} else if (constructionMode === "repair") {
    laborCost = totalMaterialsCost × 0.2
    removalCost = totalMaterialsCost × 0.1
}

// Total Cost
totalCost = totalMaterialsCost + laborCost + removalCost
```

#### Complexity Scoring Factors

```javascript
score = 1; // Base score

// Factor 1: Pitch Complexity (0-3 points)
if (pitch >= 45) score += 3; // Very steep
else if (pitch >= 30) score += 2; // Steep
else if (pitch < 10) score += 2; // Too flat

// Factor 2: Roof Type Complexity (0-3 points)
roofTypeScores = {
    flat: 1, gable: 0, hip: 2, mansard: 3, gambrel: 3
};

// Factor 3: Building Height (0-2 points)
if (floors >= 3) score += 2; // Multi-story
else if (floors === 2) score += 1; // Two-story

// Factor 4: Material Complexity (0-3 points)
materialComplexity = {
    asphalt: 0, wood: 1, metal: 2, tile: 3, slate: 3
};

// Factor 5: Material Thickness (0-1 point)
if (thickness === "premium") score += 1;

// Factor 6: Ridge & Gutter Specs (0-1 point)
if (ridgeType === "ventilated" || gutterSize === "large") score += 1;

// Factor 7: Area Complexity (1-3 points)
if (area > 200) score += 3;
else if (area > 150) score += 2;
else score += 1;

// Normalize to 1-10 scale
finalScore = min(max(score, 1), 10);
```

---

### D. Project Management System

Complete project lifecycle management with workflow automation and Kanban boards.

#### Project Status Workflow

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create Project
    DRAFT --> ACTIVE: Make Active
    DRAFT --> CLIENT_PENDING: Request Quote
    CLIENT_PENDING --> CONTRACTOR_REVIEWING: Admin Review
    CONTRACTOR_REVIEWING --> PROPOSAL_SENT: Send Proposal
    CONTRACTOR_REVIEWING --> REJECTED: Withdraw
    PROPOSAL_SENT --> ACCEPTED: Client Accepts
    PROPOSAL_SENT --> REJECTED: Client Rejects
    ACCEPTED --> COMPLETED: Finish Project
    COMPLETED --> ARCHIVED: Archive
    REJECTED --> DRAFT: Reset for New Quote
    REJECTED --> CONTRACTOR_REVIEWING: Revise Proposal
    REJECTED --> ARCHIVED: Archive
    ARCHIVED --> COMPLETED: Unarchive
```

#### Project Stages

1. **DRAFT**: Project created and being prepared
2. **CLIENT_PENDING**: Awaiting client quote request
3. **CONTRACTOR_REVIEWING**: Admin reviewing project details
4. **PROPOSAL_SENT**: Proposal sent to client
5. **ACCEPTED**: Client accepted proposal
6. **COMPLETED**: Project finished
7. **REJECTED**: Project declined
8. **ARCHIVED**: Project archived

#### Project Management Features

- Visual project cards with key information
- Filter by status, client, contractor
- Search and sort capabilities
- Real-time updates
- Stage progress tracking

---


### E. Notification System

Real-time notifications for project updates and system events.

#### Notification Types

- **Project Status Changes**: Updates when project status changes
- **Proposal Notifications**: New proposals sent/received
- **Assignment Notifications**: Contractor assigned to project
- **System Alerts**: Maintenance mode, updates

#### Notification Flow

```mermaid
sequenceDiagram
    participant E as Event Trigger
    participant N as Notification Service
    participant DB as Database
    participant UI as Frontend
    participant U as User

    E->>N: Event Occurs
    N->>DB: Create Notification
    DB->>N: Notification Stored
    N->>UI: Push Notification
    UI->>U: Display Notification
    U->>UI: Mark as Read
    UI->>DB: Update Read Status
```

---

### F. Tutorial & Onboarding System

Interactive tutorial system providing comprehensive guidance and learning resources for all users.

#### Features

- **Interactive Tutorial Dialog**: Comprehensive guide accessible from dashboard sidebar
- **Multi-Tab Content**: 8+ tutorial sections covering all features
- **Visual Learning**: Image galleries for materials, components, and roof types
- **Contextual Help**: Role-specific guidance and best practices
- **Material Database**: Visual reference for roofing materials with specifications

#### Tutorial Sections

- **Overview & Getting Started**: Welcome guide and platform introduction
- **Roof Types**: Detailed coverage of Gable, Hip, Shed, and complex roof configurations
- **Materials Guide**: Comprehensive material selection with Asphalt, Metal, Tile, and specialty options
- **Calculator Workflow**: Step-by-step estimation process guidance
- **Manual Entry Options**: Alternative input methods and calculations
- **Project Management**: Complete project lifecycle management guide
- **AI Recommendations System**: Understanding intelligent decision support

#### Material Visual Database

The system includes an extensive visual reference library located in `/public/roof/`:

- **Roofing Materials**: Corrugated, long-span, and specialty roofing systems
- **Ridge Caps & Vents**: Various ridge cap styles and ventilation options
- **Gutters**: GI (Galvanized Iron), PVC, and stainless steel gutter systems
- **Screws & Fasteners**: Self-drilling hex, tile screws, and specialized fasteners
- **Insulation Types**: Fiber glass batt, foam board, mineral wool, and spray foam
- **Ventilation Components**: Static vents, turbine vents, ridge vents, and exhaust fans

#### User Experience

- **Role-Based Content**: Tailored guidance based on user permissions (CLIENT, ADMIN, DEVELOPER)
- **Progressive Learning**: Structured learning path from basic to advanced features
- **Quick Reference**: Fast access to specific topics and troubleshooting
- **Mobile Responsive**: Optimized for all device types and screen sizes

---

## Data Flow Diagrams

### Context-Level DFD

```mermaid
flowchart LR
    subgraph "External Entities"
        CLIENT[Client Users]
        ADMIN[Admin Users]
        DEVELOPER[Developer Users]
        EMAIL_SVC[Email Service]
    end

    subgraph "RoofCalc System"
        SYSTEM[RoofCalc Application]
    end

    CLIENT -->|Project Requests, Estimates| SYSTEM
    ADMIN -->|Project Management, Warehouse| SYSTEM
    DEVELOPER -->|System Control, Database| SYSTEM
    SYSTEM -->|Verification Codes, Notifications| EMAIL_SVC
    EMAIL_SVC -->|Email Delivery| CLIENT
    EMAIL_SVC -->|Email Delivery| ADMIN
```

### Level 1 DFD

```mermaid
flowchart TB
    subgraph "External Entities"
        USER[Users]
        EMAIL[Email Service]
    end

    subgraph "Processes"
        P1[1.0<br/>Authentication]
        P2[2.0<br/>Roof Calculator]
        P3[3.0<br/>Project Management]
        P4[4.0<br/>Notifications]
    end

    subgraph "Data Stores"
        D1[(D1: Users)]
        D2[(D2: Projects)]
        D3[(D3: Notifications)]
    end

    USER -->|Login/Signup| P1
    P1 -->|Create/Update| D1
    P1 -->|Send Code| EMAIL
    
    USER -->|Calculate Estimate| P2
    P2 -->|Read/Write| D2
    
    USER -->|Manage Projects| P3
    P3 -->|Read/Write| D2
    P3 -->|Read| D1
    
    P3 -->|Send Alerts| P4
    P4 -->|Create| D3
    P4 -->|Send| EMAIL
```

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ PROJECT : creates
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ ACTIVITY : generates
    USER ||--o{ VERIFICATIONCODE : has

    PROJECT }o--|| USER : assigned_to_client
    PROJECT }o--|| USER : assigned_to_contractor

    USER {
        string id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        enum role
        datetime email_verified
        boolean passwordChangeRequired
        boolean isDisabled
        datetime created_at
        datetime updated_at
    }

    PROJECT {
        string id PK
        string userId FK
        string clientId FK
        string contractorId FK
        string projectName
        string status
        decimal length
        decimal width
        decimal pitch
        string roofType
        string material
        decimal area
        decimal totalCost
        string currentStage
        datetime created_at
        datetime updated_at
    }

    NOTIFICATION {
        string id PK
        string userId FK
        string type
        string title
        string message
        string projectId FK
        boolean read
        datetime created_at
    }
```

### Key Tables

#### User Table
- **id**: Unique identifier
- **email**: Unique email address
- **role**: CLIENT, ADMIN, or DEVELOPER
- **email_verified**: Email verification timestamp
- **passwordChangeRequired**: Boolean flag for forced password changes
- **isDisabled**: Boolean flag for account status (true = disabled, false = active)

#### Project Table
- **id**: Unique identifier
- **userId**: Project creator
- **clientId**: Assigned client
- **contractorId**: Assigned contractor
- **status**: Project workflow status (DRAFT, CLIENT_PENDING, CONTRACTOR_REVIEWING, PROPOSAL_SENT, ACCEPTED, COMPLETED, REJECTED, ARCHIVED)
- **currentStage**: Current project stage
- **materialCost**: Calculated material cost
- **totalCost**: Total project cost
- **boardPosition**: Integer for Kanban card ordering
- **proposalPosition**: Integer for proposal view ordering
- **stageProgress**: JSON field for stage completion tracking

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Create new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created. Verification code sent to email."
}
```

#### POST /api/auth/verify-code
Verify email with 6-digit code.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

#### POST /api/auth/login
Authenticate user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### POST /api/auth/request-reset
Request password reset code.

#### POST /api/auth/reset-password
Reset password with verification code.

### Project Endpoints

#### GET /api/projects
Get all projects for current user.

**Query Parameters:**
- `status`: Filter by status
- `page`: Page number
- `limit`: Results per page

#### POST /api/projects
Create new project.

**Request:**
```json
{
  "projectName": "Residential Roof",
  "length": 15,
  "width": 10,
  "pitch": 25,
  "roofType": "gable",
  "material": "metal",
  "constructionMode": "new"
}
```

#### GET /api/projects/[id]
Get project details.

#### PUT /api/projects/[id]
Update project.

#### DELETE /api/projects/[id]
Delete project.

#### POST /api/projects/[id]/send-to-contractor
Send project to contractor for review.

#### POST /api/projects/[id]/approve
Approve project proposal.

#### POST /api/projects/[id]/decline
Decline project proposal.

#### POST /api/projects/[id]/finish
Mark project as completed.

### Notification Endpoints

#### GET /api/notifications
Get user notifications.

**Query Parameters:**
- `read`: Filter by read status
- `type`: Filter by notification type

#### PUT /api/notifications/[id]/read
Mark notification as read.

### System Endpoints

#### GET /api/system/maintenance/status
Get maintenance mode status.

#### POST /api/system/maintenance
Toggle maintenance mode.

### Admin Management Endpoints

#### POST /api/admin/create
Create new admin account with temporary password.

**Request:**
```json
{
  "email": "admin@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "temporaryPassword": "TempPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "userId": "user-id",
  "passwordChangeRequired": true
}
```

### Account Management Endpoints

#### GET /api/accounts
Get all user accounts with filtering and pagination.

**Query Parameters:**
- `status`: Filter by account status (active, disabled)
- `role`: Filter by user role
- `search`: Search by name or email
- `page`: Page number
- `limit`: Results per page

#### POST /api/accounts/[id]/disable
Disable a user account.

**Response:**
```json
{
  "success": true,
  "message": "Account disabled successfully"
}
```

#### POST /api/accounts/[id]/enable
Enable a user account.

**Response:**
```json
{
  "success": true,
  "message": "Account enabled successfully"
}
```

#### DELETE /api/accounts/[id]
Delete a user account (permanent removal).

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## Key Features

### 1. Intelligent Roof Calculator

- **Decision Tree Algorithm**: Analyzes project parameters to recommend optimal materials
- **Complexity Scoring**: 1-10 scale based on 7 factors
- **Budget Validation**: Real-time budget checking with minimum requirements
- **Optimization Engine**: Auto-adjust settings to reduce complexity

### 2. Project Workflow Management

- **Project Management**: Visual project management interface
- **Status Transitions**: Enforced workflow with role-based permissions
- **Stage Tracking**: 5-stage project lifecycle
- **Proposal Management**: Complete proposal creation and approval flow

### 3. User Account Management

- **Account Status Control**: Enable/disable user accounts with immediate effect
- **Administrative Interface**: Visual management interface for user accounts
- **Security Enforcement**: Disabled users are immediately logged out and blocked
- **Activity Logging**: Complete audit trail of account management actions
- **Role-Based Access**: Only ADMIN and DEVELOPER roles can manage accounts

### 4. Notification System

- **Real-Time Alerts**: Instant notifications for key events
- **Email Notifications**: Verification codes and alerts
- **In-App Notifications**: Real-time dashboard updates
- **Read/Unread Tracking**: Notification management

### 5. Dark Mode & Theming

- **Light/Dark Mode**: Complete theme system with smooth transitions
- **System Preference**: Automatic detection of OS theme preference
- **Theme Persistence**: User preference stored across sessions
- **Accessible Toggle**: Available on all pages (dashboard, auth, landing)
- **CSS Variables**: Comprehensive design token system

### 6. Dashboard Sections by Role

The application provides role-based dashboard sections with specific functionality:

#### CLIENT Dashboard Sections
- **Roof Calculator**: Create and manage roofing estimates
- **My Projects**: View and manage personal projects
- **Archived Projects**: Access completed and archived projects

#### ADMIN Dashboard Sections
- **Contractor Projects**: Project management and workflow
- **Account Management**: User administration and account controls
- **System Maintenance**: System health monitoring and maintenance controls

#### DEVELOPER Dashboard Sections
- **Database Management**: Direct database access and management tools
- **System Control**: Advanced system configuration and control panel
- **Admin Management**: Create and manage admin accounts with temporary passwords

---

## User Journeys

### Journey 1: Client Creates and Requests Quote

```mermaid
sequenceDiagram
    participant C as Client
    participant RC as Roof Calculator
    participant DB as Database
    participant A as Admin
    participant N as Notification

    C->>RC: Enter project details
    RC->>RC: Calculate estimate
    RC->>C: Show cost breakdown
    C->>RC: Save project
    RC->>DB: Create project (DRAFT)
    C->>RC: Request quote
    RC->>DB: Update status (CLIENT_PENDING)
    RC->>N: Create notification
    N->>A: Notify admin
    A->>DB: Update status (CONTRACTOR_REVIEWING)
    A->>DB: Create proposal
    A->>DB: Update status (PROPOSAL_SENT)
    A->>N: Create notification
    N->>C: Notify client
    C->>RC: Review proposal
    C->>RC: Accept proposal
    RC->>DB: Update status (ACCEPTED)
```

### Journey 2: Admin Reviews and Executes Project

```mermaid
sequenceDiagram
    participant A as Admin
    participant DB as Database
    participant C as Client

    A->>DB: Get pending projects
    A->>DB: Review project details
    A->>DB: Create proposal
    A->>DB: Update status (PROPOSAL_SENT)
    A->>C: Send proposal
    C->>DB: Accept proposal
    DB->>A: Notify acceptance
    A->>DB: Update status (ACCEPTED)
    A->>DB: Update status (COMPLETED)
```


---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd roofcalc
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/roofcalc"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

```

4. **Set up the database**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed pricing data
npm run seed
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to `http://localhost:3000`

### Creating Your First User

1. Go to `/signup`
2. Enter your details
3. Check your email for the verification code
4. Verify your email
5. You'll be logged in as a CLIENT
6. Access the tutorial guide from the dashboard sidebar for comprehensive guidance
7. Dark mode is enabled by default and can be toggled from any page

### Promoting to Admin

To promote a user to ADMIN role, use the database directly:

```sql
UPDATE user 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

### Creating Admin Accounts (Developers)

Developers can create admin accounts through the Admin Management section:

1. Navigate to the Admin Management section in the developer dashboard
2. Use the admin creation form to generate new admin accounts
3. New admins will receive temporary passwords and be required to change them on first login
4. All admin accounts start with password change requirements enabled

---

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

Ensure these are set in your production environment:

```env
DATABASE_URL="mysql://user:password@host:3306/roofcalc"
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://your-domain.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Database Migration in Production

```bash
npm run prisma:deploy
```

### Recommended Hosting

- **Frontend/Backend**: Vercel, Netlify, or AWS
- **Database**: AWS RDS, PlanetScale, or DigitalOcean
- **Email**: Gmail SMTP, SendGrid, or AWS SES

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For support, email support@roofcalc.com or create an issue in the repository.

---

**Built with ❤️ using Next.js, React, TypeScript, and Prisma**