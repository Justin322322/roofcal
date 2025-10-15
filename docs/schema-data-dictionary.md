# Prisma Schema Data Dictionary

## Overview

This document provides a comprehensive reference for the database schema defined in `prisma/schema.prisma`. The database is designed for a roof calculation and project management system that handles user authentication, project management, material inventory, and warehouse operations.

## Table of Contents

- [Models](#models)
  - [Notification](#notification)
  - [PricingConfig](#pricingconfig)
  - [ProjectMaterial](#projectmaterial)
  - [WarehouseMaterial](#warehousematerial)
  - [activity](#activity)
  - [project](#project)
  - [ratelimit](#ratelimit)
  - [systemsettings](#systemsettings)
  - [user](#user)
  - [verificationcode](#verificationcode)
  - [warehouse](#warehouse)
- [Enums](#enums)
- [Relationships Diagram](#relationships-diagram)
- [Index Reference](#index-reference)

## Models

### Notification

User notification system for tracking system alerts and project updates.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| userId | String | Foreign Key → user.id | - | Reference to user receiving notification |
| type | String | - | - | Notification type/category |
| title | String | - | - | Notification title |
| message | String (TEXT) | - | - | Notification message content |
| projectId | String | Nullable | - | Reference to related project (optional) |
| projectName | String | Nullable | - | Name of related project (optional) |
| actionUrl | String | Nullable | - | URL for notification action (optional) |
| read | Boolean | - | false | Whether notification has been read |
| created_at | DateTime | - | now() | Timestamp of notification creation |

**Relationships:**
- `user` → One-to-Many → `Notification` (via userId)

**Indexes:**
- `created_at` - For chronological sorting
- `read` - For filtering unread notifications
- `userId` - For user-specific queries

---

### PricingConfig

Material pricing configuration and specifications for the system.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| category | String | - | - | Material category |
| name | String | Unique (category, name) | - | Material name |
| label | String | - | - | Display label |
| description | String | Nullable | - | Material description |
| price | Decimal(10,2) | - | - | Material price |
| unit | String | - | - | Pricing unit |
| isActive | Boolean | - | true | Whether material is active |
| metadata | String (LONGTEXT) | Nullable | - | Additional metadata |
| created_at | DateTime | - | now() | Creation timestamp |
| updated_at | DateTime | - | - | Last update timestamp |
| height | Decimal(8,2) | Nullable | - | Material height |
| length | Decimal(8,2) | Nullable | - | Material length |
| volume | Decimal(10,4) | Nullable | - | Material volume |
| width | Decimal(8,2) | Nullable | - | Material width |

**Relationships:**
- `PricingConfig` → One-to-Many → `WarehouseMaterial` (via materialId)

**Indexes:**
- `category` - For category-based queries
- `isActive` - For filtering active materials

---

### ProjectMaterial

Material allocation and consumption tracking for projects.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| projectId | String | Foreign Key → project.id | - | Reference to project |
| warehouseMaterialId | String | Foreign Key → WarehouseMaterial.id | - | Reference to warehouse material |
| quantity | Int | - | 0 | Quantity allocated |
| status | ProjectMaterial_status | - | RESERVED | Material status |
| reservedAt | DateTime | - | now() | When material was reserved |
| consumedAt | DateTime | Nullable | - | When material was consumed |
| returnedAt | DateTime | Nullable | - | When material was returned |
| notes | String (LONGTEXT) | Nullable | - | Additional notes |
| created_at | DateTime | - | now() | Creation timestamp |
| updated_at | DateTime | - | - | Last update timestamp |

**Relationships:**
- `project` → One-to-Many → `ProjectMaterial` (via projectId)
- `WarehouseMaterial` → One-to-Many → `ProjectMaterial` (via warehouseMaterialId)

**Indexes:**
- `consumedAt` - For tracking consumption
- `projectId` - For project-specific queries
- `status` - For status-based filtering
- `warehouseMaterialId` - For material-specific queries

---

### WarehouseMaterial

Warehouse inventory management for materials.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| warehouseId | String | Foreign Key → warehouse.id | - | Reference to warehouse |
| materialId | String | Foreign Key → PricingConfig.id | - | Reference to material config |
| quantity | Int | - | 0 | Available quantity |
| locationAdjustment | Decimal(5,2) | - | 0.00 | Location-based cost adjustment |
| isActive | Boolean | - | true | Whether material is active |
| created_at | DateTime | - | now() | Creation timestamp |
| updated_at | DateTime | - | - | Last update timestamp |

**Relationships:**
- `warehouse` → One-to-Many → `WarehouseMaterial` (via warehouseId)
- `PricingConfig` → One-to-Many → `WarehouseMaterial` (via materialId)
- `WarehouseMaterial` → One-to-Many → `ProjectMaterial` (via warehouseMaterialId)

**Indexes:**
- `isActive` - For filtering active materials
- `materialId` - For material-specific queries
- `warehouseId` - For warehouse-specific queries

---

### activity

User activity tracking and audit logging.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| userId | String | Foreign Key → user.id | - | Reference to user |
| type | activity_type | - | - | Type of activity |
| description | String | - | - | Activity description |
| metadata | String (LONGTEXT) | Nullable | - | Additional activity metadata |
| created_at | DateTime | - | now() | Activity timestamp |

**Relationships:**
- `user` → One-to-Many → `activity` (via userId)

**Indexes:**
- `created_at` - For chronological sorting
- `type` - For activity type filtering
- `userId` - For user-specific queries

---

### project

Main project entity with comprehensive roof calculation and project management data.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| userId | String | Foreign Key → user.id | - | Project creator |
| projectName | String | - | - | Project name |
| clientName | String | Nullable | - | Client name |
| status | project_status | - | DRAFT | Project status |
| length | Decimal(10,2) | - | - | Roof length |
| width | Decimal(10,2) | - | - | Roof width |
| pitch | Decimal(5,2) | - | - | Roof pitch |
| roofType | String | - | - | Type of roof |
| floors | Int | - | - | Number of floors |
| materialThickness | String | - | - | Material thickness |
| ridgeType | String | - | - | Ridge type |
| gutterSize | String | - | - | Gutter size |
| budgetLevel | String | - | - | Budget level |
| budgetAmount | Decimal(12,2) | Nullable | - | Budget amount |
| constructionMode | project_constructionMode | - | NEW | Construction mode |
| gutterLengthA | Decimal(10,2) | Nullable | - | Gutter length A |
| gutterSlope | Decimal(10,2) | Nullable | - | Gutter slope |
| gutterLengthC | Decimal(10,2) | Nullable | - | Gutter length C |
| insulationThickness | String | - | - | Insulation thickness |
| ventilationPieces | Int | - | - | Number of ventilation pieces |
| material | String | - | - | Primary material |
| area | Decimal(10,2) | - | - | Total roof area |
| materialCost | Decimal(12,2) | - | - | Material cost |
| gutterCost | Decimal(12,2) | - | - | Gutter cost |
| ridgeCost | Decimal(12,2) | - | - | Ridge cost |
| screwsCost | Decimal(12,2) | - | - | Screws cost |
| insulationCost | Decimal(12,2) | - | - | Insulation cost |
| ventilationCost | Decimal(12,2) | - | - | Ventilation cost |
| totalMaterialsCost | Decimal(12,2) | - | - | Total materials cost |
| laborCost | Decimal(12,2) | - | - | Labor cost |
| removalCost | Decimal(12,2) | - | - | Removal cost |
| totalCost | Decimal(12,2) | - | - | Total project cost |
| gutterPieces | Int | - | - | Number of gutter pieces |
| ridgeLength | Decimal(10,2) | - | - | Ridge length |
| complexityScore | Int | - | - | Project complexity score |
| complexityLevel | String | - | - | Complexity level |
| recommendedMaterial | String | Nullable | - | Recommended material |
| optimizationTips | String (LONGTEXT) | Nullable | - | Optimization suggestions |
| notes | String (LONGTEXT) | Nullable | - | Project notes |
| created_at | DateTime | - | now() | Creation timestamp |
| updated_at | DateTime | - | - | Last update timestamp |
| address | String | Nullable | - | Project address |
| assignedAt | DateTime | Nullable | - | Assignment timestamp |
| city | String | Nullable | - | Project city |
| clientId | String | Foreign Key → user.id | - | Client reference |
| contractorId | String | Foreign Key → user.id | - | Contractor reference |
| deliveryCost | Decimal(12,2) | Nullable | - | Delivery cost |
| deliveryDistance | Decimal(8,2) | Nullable | - | Delivery distance |
| latitude | Decimal(10,8) | Nullable | - | GPS latitude |
| longitude | Decimal(11,8) | Nullable | - | GPS longitude |
| proposalSent | DateTime | Nullable | - | Proposal sent timestamp |
| proposalStatus | project_proposalStatus | - | DRAFT | Proposal status |
| state | String | Nullable | - | Project state |
| warehouseId | String | Foreign Key → warehouse.id | - | Assigned warehouse |
| zipCode | String | Nullable | - | Project zip code |
| materialsConsumed | Boolean | - | false | Whether materials consumed |
| materialsConsumedAt | DateTime | Nullable | - | Materials consumption timestamp |
| boardPosition | Int | - | 0 | Kanban board position |
| proposalPosition | Int | - | 0 | Proposal board position |
| currentStage | project_currentStage | - | INSPECTION | Current project stage |
| stageProgress | Json | Nullable | - | Stage progress data |
| sentToContractorAt | DateTime | Nullable | - | Handoff to contractor timestamp |
| contractorStatus | String | Nullable | - | Contractor status |
| handoffNote | String (LONGTEXT) | Nullable | - | Handoff notes |

**Relationships:**
- `user` → One-to-Many → `project` (via userId) - Project creator
- `user` → One-to-Many → `project` (via clientId) - Project client
- `user` → One-to-Many → `project` (via contractorId) - Project contractor
- `warehouse` → One-to-Many → `project` (via warehouseId)
- `project` → One-to-Many → `ProjectMaterial` (via projectId)

**Indexes:**
- `clientId` - For client-specific queries
- `contractorId` - For contractor-specific queries
- `created_at` - For chronological sorting
- `projectName` - For name-based searches
- `status` - For status-based filtering
- `userId` - For user-specific queries
- `warehouseId` - For warehouse-specific queries

---

### ratelimit

Rate limiting for user actions and security.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| email | String | Unique (email, action) | - | User email |
| action | String | Unique (email, action) | "otp_generation" | Rate limited action |
| attempts | Int | - | 0 | Number of attempts |
| lastAttempt | DateTime | - | - | Last attempt timestamp |
| blockedUntil | DateTime | Nullable | - | Block expiry timestamp |
| created_at | DateTime | - | now() | Creation timestamp |
| updated_at | DateTime | - | - | Last update timestamp |

**Indexes:**
- `blockedUntil` - For checking active blocks
- `created_at` - For chronological sorting

---

### systemsettings

System-wide configuration and maintenance settings.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| maintenanceMode | Boolean | - | false | Whether system in maintenance |
| maintenanceMessage | String (TEXT) | Nullable | - | Maintenance message |
| maintenanceScheduledEnd | DateTime | Nullable | - | Scheduled maintenance end |
| maintenanceStartedBy | String | Nullable | - | Who started maintenance |
| maintenanceStartedAt | DateTime | Nullable | - | Maintenance start timestamp |
| updated_at | DateTime | - | - | Last update timestamp |

**Indexes:**
- `maintenanceMode` - For maintenance status checks

---

### user

User accounts and authentication system.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| email | String | Unique | - | User email address |
| passwordHash | String | - | - | Hashed password |
| firstName | String | - | - | User first name |
| lastName | String | - | - | User last name |
| role | user_role | - | CLIENT | User role |
| email_verified | DateTime | Nullable | - | Email verification timestamp |
| passwordChangeRequired | Boolean | - | false | Whether password change required |
| isDisabled | Boolean | - | false | Whether account disabled |
| created_at | DateTime | - | now() | Account creation timestamp |
| updated_at | DateTime | - | - | Last update timestamp |

**Relationships:**
- `user` → One-to-Many → `Notification` (via userId)
- `user` → One-to-Many → `activity` (via userId)
- `user` → One-to-Many → `project` (via userId) - As creator
- `user` → One-to-Many → `project` (via clientId) - As client
- `user` → One-to-Many → `project` (via contractorId) - As contractor
- `user` → One-to-Many → `verificationcode` (via email)
- `user` → One-to-Many → `warehouse` (via created_by)

**Indexes:**
- `email` - For email-based queries
- `isDisabled` - For filtering disabled accounts

---

### verificationcode

Email verification codes for user registration and password reset.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| code | String (VARCHAR(6)) | - | - | 6-digit verification code |
| email | String | Foreign Key → user.email | - | User email |
| type | String | - | "email_verification" | Code type |
| expiresAt | DateTime | - | - | Code expiration |
| used | Boolean | - | false | Whether code has been used |
| created_at | DateTime | - | now() | Creation timestamp |

**Relationships:**
- `user` → One-to-Many → `verificationcode` (via email)

**Indexes:**
- `code` - For code lookup
- `email` - For email-based queries
- `expiresAt` - For cleanup of expired codes

---

### warehouse

Warehouse locations and specifications.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String | Primary Key | - | Unique identifier |
| name | String | - | - | Warehouse name |
| address | String | - | - | Warehouse address |
| city | String | - | - | Warehouse city |
| state | String | - | - | Warehouse state |
| zipCode | String | - | - | Warehouse zip code |
| latitude | Decimal(10,8) | - | - | GPS latitude |
| longitude | Decimal(11,8) | - | - | GPS longitude |
| isDefault | Boolean | - | false | Whether default warehouse |
| created_by | String | Foreign Key → user.id | - | Warehouse creator |
| created_at | DateTime | - | now() | Creation timestamp |
| updated_at | DateTime | - | - | Last update timestamp |
| capacity | Decimal(12,2) | Nullable | - | Warehouse capacity |
| height | Decimal(8,2) | Nullable | - | Warehouse height |
| length | Decimal(8,2) | Nullable | - | Warehouse length |
| width | Decimal(8,2) | Nullable | - | Warehouse width |

**Relationships:**
- `user` → One-to-Many → `warehouse` (via created_by)
- `warehouse` → One-to-Many → `WarehouseMaterial` (via warehouseId)
- `warehouse` → One-to-Many → `project` (via warehouseId)

**Indexes:**
- `created_by` - For creator-based queries

## Enums

### activity_type

Types of user activities tracked in the system.

| Value | Description |
|-------|-------------|
| LOGIN | User login activity |
| LOGOUT | User logout activity |
| PROFILE_UPDATE | Profile modification |
| PASSWORD_CHANGE | Password change activity |
| ACCOUNT_CREATED | Account creation |
| PROJECT_CREATED | Project creation |
| PROJECT_UPDATED | Project modification |
| PAYMENT_RECEIVED | Payment processing |
| EMAIL_VERIFIED | Email verification |

### ProjectMaterial_status

Material allocation and consumption states.

| Value | Description |
|-------|-------------|
| RESERVED | Material reserved for project |
| CONSUMED | Material consumed/used |
| RETURNED | Material returned to warehouse |
| CANCELLED | Material reservation cancelled |

### project_status

Project workflow states throughout the lifecycle.

| Value | Description |
|-------|-------------|
| DRAFT | Initial project draft |
| ACTIVE | Active project |
| CLIENT_PENDING | Awaiting client response |
| CONTRACTOR_REVIEWING | Under contractor review |
| PROPOSAL_SENT | Proposal sent to client |
| ACCEPTED | Project accepted |
| IN_PROGRESS | Project in progress |
| COMPLETED | Project completed |
| ARCHIVED | Project archived |
| REJECTED | Project rejected |
| FOR_CLIENT_REVIEW | Pending client review |

### user_role

User permission levels and access control.

| Value | Description |
|-------|-------------|
| CLIENT | Standard client user |
| ADMIN | Administrative user |
| DEVELOPER | Developer/technical user |

### project_constructionMode

Construction project types.

| Value | Description |
|-------|-------------|
| NEW | New construction project |
| REPAIR | Repair/maintenance project |

### project_proposalStatus

Proposal workflow states.

| Value | Description |
|-------|-------------|
| DRAFT | Initial proposal draft |
| SENT | Proposal sent to client |
| ACCEPTED | Proposal accepted |
| REJECTED | Proposal rejected |
| REVISED | Proposal revised |
| COMPLETED | Proposal completed |

### project_currentStage

Project execution stages.

| Value | Description |
|-------|-------------|
| INSPECTION | Initial inspection stage |
| ESTIMATE | Cost estimation stage |
| MATERIALS | Material procurement stage |
| INSTALL | Installation stage |
| FINALIZE | Project finalization |

## Relationships Diagram

```
user
├── One-to-Many → Notification
├── One-to-Many → activity
├── One-to-Many → project (as creator)
├── One-to-Many → project (as client)
├── One-to-Many → project (as contractor)
├── One-to-Many → verificationcode
└── One-to-Many → warehouse

project
├── One-to-Many → ProjectMaterial
├── Many-to-One → user (creator)
├── Many-to-One → user (client)
├── Many-to-One → user (contractor)
└── Many-to-One → warehouse

warehouse
├── One-to-Many → WarehouseMaterial
└── One-to-Many → project

PricingConfig
└── One-to-Many → WarehouseMaterial

WarehouseMaterial
├── One-to-Many → ProjectMaterial
├── Many-to-One → warehouse
└── Many-to-One → PricingConfig

ProjectMaterial
├── Many-to-One → project
└── Many-to-One → WarehouseMaterial
```

## Index Reference

### Performance Indexes

| Table | Column(s) | Purpose |
|-------|-----------|---------|
| Notification | created_at | Chronological sorting |
| Notification | read | Filter unread notifications |
| Notification | userId | User-specific queries |
| PricingConfig | category | Category-based filtering |
| PricingConfig | isActive | Filter active materials |
| ProjectMaterial | consumedAt | Track consumption |
| ProjectMaterial | projectId | Project-specific queries |
| ProjectMaterial | status | Status-based filtering |
| ProjectMaterial | warehouseMaterialId | Material-specific queries |
| WarehouseMaterial | isActive | Filter active materials |
| WarehouseMaterial | materialId | Material-specific queries |
| WarehouseMaterial | warehouseId | Warehouse-specific queries |
| activity | created_at | Chronological sorting |
| activity | type | Activity type filtering |
| activity | userId | User-specific queries |
| project | clientId | Client-specific queries |
| project | contractorId | Contractor-specific queries |
| project | created_at | Chronological sorting |
| project | projectName | Name-based searches |
| project | status | Status-based filtering |
| project | userId | User-specific queries |
| project | warehouseId | Warehouse-specific queries |
| ratelimit | blockedUntil | Check active blocks |
| ratelimit | created_at | Chronological sorting |
| systemsettings | maintenanceMode | Maintenance status checks |
| user | email | Email-based queries |
| user | isDisabled | Filter disabled accounts |
| verificationcode | code | Code lookup |
| verificationcode | email | Email-based queries |
| verificationcode | expiresAt | Cleanup expired codes |
| warehouse | created_by | Creator-based queries |

### Unique Constraints

| Table | Column(s) | Purpose |
|-------|-----------|---------|
| PricingConfig | category, name | Prevent duplicate materials |
| ProjectMaterial | projectId, warehouseMaterialId | One allocation per project-material |
| WarehouseMaterial | warehouseId, materialId | One entry per warehouse-material |
| ratelimit | email, action | One rate limit per email-action |
| user | email | Unique email addresses |
