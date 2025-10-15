# Prisma Schema Data Dictionary

## Overview

This document provides a comprehensive reference for the database schema defined in `prisma/schema.prisma`. The database is designed for a roof calculation and project management system that handles user authentication, project management, material inventory, and warehouse operations.

## Table of Contents

- [Models](#models)
  - [Table 1. user](#table-1-user)
  - [Table 2. project](#table-2-project)
  - [Table 3. PricingConfig](#table-3-pricingconfig)
  - [Table 4. warehouse](#table-4-warehouse)
  - [Table 5. WarehouseMaterial](#table-5-warehousematerial)
  - [Table 6. ProjectMaterial](#table-6-projectmaterial)
  - [Table 7. Notification](#table-7-notification)
  - [Table 8. activity](#table-8-activity)
  - [Table 9. verificationcode](#table-9-verificationcode)
  - [Table 10. ratelimit](#table-10-ratelimit)
  - [Table 11. systemsettings](#table-11-systemsettings)
- [Enums](#enums)
  - [Table 12. activity_type](#table-12-activity_type)
  - [Table 13. ProjectMaterial_status](#table-13-projectmaterial_status)
  - [Table 14. project_status](#table-14-project_status)
  - [Table 15. user_role](#table-15-user_role)
  - [Table 16. project_constructionMode](#table-16-project_constructionmode)
  - [Table 17. project_proposalStatus](#table-17-project_proposalstatus)
  - [Table 18. project_currentStage](#table-18-project_currentstage)
- [Relationships Diagram](#relationships-diagram)
- [Index Reference](#index-reference)

## Models

### Table 1. user

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: user |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | No | Yes | email | varchar | 255 | No | - | User email address |
| No | No | No | passwordHash | varchar | 255 | No | - | Hashed password |
| No | No | No | firstName | varchar | 255 | No | - | User first name |
| No | No | No | lastName | varchar | 255 | No | - | User last name |
| No | No | No | role | enum | - | No | CLIENT | User role |
| No | No | No | email_verified | datetime | - | Yes | - | Email verification timestamp |
| No | No | No | passwordChangeRequired | tinyint | 1 | No | false | Whether password change required |
| No | No | No | isDisabled | tinyint | 1 | No | false | Whether account disabled |
| No | No | No | created_at | datetime | - | No | now() | Account creation timestamp |
| No | No | No | updated_at | datetime | - | No | - | Last update timestamp |

---

### Table 2. project

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: project |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | Yes | No | userId | varchar | 255 | No | - | Project creator |
| No | No | No | projectName | varchar | 255 | No | - | Project name |
| No | No | No | clientName | varchar | 255 | Yes | - | Client name |
| No | No | No | status | enum | - | No | DRAFT | Project status |
| No | No | No | length | decimal | 10,2 | No | - | Roof length |
| No | No | No | width | decimal | 10,2 | No | - | Roof width |
| No | No | No | pitch | decimal | 5,2 | No | - | Roof pitch |
| No | No | No | roofType | varchar | 255 | No | - | Type of roof |
| No | No | No | floors | int | 11 | No | - | Number of floors |
| No | No | No | materialThickness | varchar | 255 | No | - | Material thickness |
| No | No | No | ridgeType | varchar | 255 | No | - | Ridge type |
| No | No | No | gutterSize | varchar | 255 | No | - | Gutter size |
| No | No | No | budgetLevel | varchar | 255 | No | - | Budget level |
| No | No | No | budgetAmount | decimal | 12,2 | Yes | - | Budget amount |
| No | No | No | constructionMode | enum | - | No | NEW | Construction mode |
| No | No | No | gutterLengthA | decimal | 10,2 | Yes | - | Gutter length A |
| No | No | No | gutterSlope | decimal | 10,2 | Yes | - | Gutter slope |
| No | No | No | gutterLengthC | decimal | 10,2 | Yes | - | Gutter length C |
| No | No | No | insulationThickness | varchar | 255 | No | - | Insulation thickness |
| No | No | No | ventilationPieces | int | 11 | No | - | Number of ventilation pieces |
| No | No | No | material | varchar | 255 | No | - | Primary material |
| No | No | No | area | decimal | 10,2 | No | - | Total roof area |
| No | No | No | materialCost | decimal | 12,2 | No | - | Material cost |
| No | No | No | gutterCost | decimal | 12,2 | No | - | Gutter cost |
| No | No | No | ridgeCost | decimal | 12,2 | No | - | Ridge cost |
| No | No | No | screwsCost | decimal | 12,2 | No | - | Screws cost |
| No | No | No | insulationCost | decimal | 12,2 | No | - | Insulation cost |
| No | No | No | ventilationCost | decimal | 12,2 | No | - | Ventilation cost |
| No | No | No | totalMaterialsCost | decimal | 12,2 | No | - | Total materials cost |
| No | No | No | laborCost | decimal | 12,2 | No | - | Labor cost |
| No | No | No | removalCost | decimal | 12,2 | No | - | Removal cost |
| No | No | No | totalCost | decimal | 12,2 | No | - | Total project cost |
| No | No | No | gutterPieces | int | 11 | No | - | Number of gutter pieces |
| No | No | No | ridgeLength | decimal | 10,2 | No | - | Ridge length |
| No | No | No | complexityScore | int | 11 | No | - | Project complexity score |
| No | No | No | complexityLevel | varchar | 255 | No | - | Complexity level |
| No | No | No | recommendedMaterial | varchar | 255 | Yes | - | Recommended material |
| No | No | No | optimizationTips | longtext | - | Yes | - | Optimization suggestions |
| No | No | No | notes | longtext | - | Yes | - | Project notes |
| No | No | No | created_at | datetime | - | No | now() | Creation timestamp |
| No | No | No | updated_at | datetime | - | No | - | Last update timestamp |
| No | No | No | address | varchar | 255 | Yes | - | Project address |
| No | No | No | assignedAt | datetime | - | Yes | - | Assignment timestamp |
| No | No | No | city | varchar | 255 | Yes | - | Project city |
| No | Yes | No | clientId | varchar | 255 | Yes | - | Client reference |
| No | Yes | No | contractorId | varchar | 255 | Yes | - | Contractor reference |
| No | No | No | deliveryCost | decimal | 12,2 | Yes | - | Delivery cost |
| No | No | No | deliveryDistance | decimal | 8,2 | Yes | - | Delivery distance |
| No | No | No | latitude | decimal | 10,8 | Yes | - | GPS latitude |
| No | No | No | longitude | decimal | 11,8 | Yes | - | GPS longitude |
| No | No | No | proposalSent | datetime | - | Yes | - | Proposal sent timestamp |
| No | No | No | proposalStatus | enum | - | Yes | DRAFT | Proposal status |
| No | No | No | state | varchar | 255 | Yes | - | Project state |
| No | Yes | No | warehouseId | varchar | 255 | Yes | - | Assigned warehouse |
| No | No | No | zipCode | varchar | 255 | Yes | - | Project zip code |
| No | No | No | materialsConsumed | tinyint | 1 | No | false | Whether materials consumed |
| No | No | No | materialsConsumedAt | datetime | - | Yes | - | Materials consumption timestamp |
| No | No | No | boardPosition | int | 11 | No | 0 | Kanban board position |
| No | No | No | proposalPosition | int | 11 | No | 0 | Proposal board position |
| No | No | No | currentStage | enum | - | No | INSPECTION | Current project stage |
| No | No | No | stageProgress | json | - | Yes | - | Stage progress data |
| No | No | No | sentToContractorAt | datetime | - | Yes | - | Handoff to contractor timestamp |
| No | No | No | contractorStatus | varchar | 255 | Yes | - | Contractor status |
| No | No | No | handoffNote | longtext | - | Yes | - | Handoff notes |

---

### Table 3. PricingConfig

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: PricingConfig |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | No | No | category | varchar | 255 | No | - | Material category |
| No | No | Yes | name | varchar | 255 | No | - | Material name |
| No | No | No | label | varchar | 255 | No | - | Display label |
| No | No | No | description | varchar | 255 | Yes | - | Material description |
| No | No | No | price | decimal | 10,2 | No | - | Material price |
| No | No | No | unit | varchar | 255 | No | - | Pricing unit |
| No | No | No | isActive | tinyint | 1 | No | true | Whether material is active |
| No | No | No | metadata | longtext | - | Yes | - | Additional metadata |
| No | No | No | created_at | datetime | - | No | now() | Creation timestamp |
| No | No | No | updated_at | datetime | - | No | - | Last update timestamp |
| No | No | No | height | decimal | 8,2 | Yes | - | Material height |
| No | No | No | length | decimal | 8,2 | Yes | - | Material length |
| No | No | No | volume | decimal | 10,4 | Yes | - | Material volume |
| No | No | No | width | decimal | 8,2 | Yes | - | Material width |

---

### Table 4. warehouse

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: warehouse |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | No | No | name | varchar | 255 | No | - | Warehouse name |
| No | No | No | address | varchar | 255 | No | - | Warehouse address |
| No | No | No | city | varchar | 255 | No | - | Warehouse city |
| No | No | No | state | varchar | 255 | No | - | Warehouse state |
| No | No | No | zipCode | varchar | 255 | No | - | Warehouse zip code |
| No | No | No | latitude | decimal | 10,8 | No | - | GPS latitude |
| No | No | No | longitude | decimal | 11,8 | No | - | GPS longitude |
| No | No | No | isDefault | tinyint | 1 | No | false | Whether default warehouse |
| No | Yes | No | created_by | varchar | 255 | No | - | Warehouse creator |
| No | No | No | created_at | datetime | - | No | now() | Creation timestamp |
| No | No | No | updated_at | datetime | - | No | - | Last update timestamp |
| No | No | No | capacity | decimal | 12,2 | Yes | - | Warehouse capacity |
| No | No | No | height | decimal | 8,2 | Yes | - | Warehouse height |
| No | No | No | length | decimal | 8,2 | Yes | - | Warehouse length |
| No | No | No | width | decimal | 8,2 | Yes | - | Warehouse width |

---

### Table 5. WarehouseMaterial

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: WarehouseMaterial |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | Yes | No | warehouseId | varchar | 255 | No | - | Reference to warehouse |
| No | Yes | No | materialId | varchar | 255 | No | - | Reference to material config |
| No | No | No | quantity | int | 11 | No | 0 | Available quantity |
| No | No | No | locationAdjustment | decimal | 5,2 | No | 0.00 | Location-based cost adjustment |
| No | No | No | isActive | tinyint | 1 | No | true | Whether material is active |
| No | No | No | created_at | datetime | - | No | now() | Creation timestamp |
| No | No | No | updated_at | datetime | - | No | - | Last update timestamp |

---

### Table 6. ProjectMaterial

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: ProjectMaterial |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | Yes | No | projectId | varchar | 255 | No | - | Reference to project |
| No | Yes | No | warehouseMaterialId | varchar | 255 | No | - | Reference to warehouse material |
| No | No | No | quantity | int | 11 | No | 0 | Quantity allocated |
| No | No | No | status | enum | - | No | RESERVED | Material status |
| No | No | No | reservedAt | datetime | - | No | now() | When material was reserved |
| No | No | No | consumedAt | datetime | - | Yes | - | When material was consumed |
| No | No | No | returnedAt | datetime | - | Yes | - | When material was returned |
| No | No | No | notes | longtext | - | Yes | - | Additional notes |
| No | No | No | created_at | datetime | - | No | now() | Creation timestamp |
| No | No | No | updated_at | datetime | - | No | - | Last update timestamp |

---

### Table 7. Notification

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: Notification |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | Yes | No | userId | varchar | 255 | No | - | Reference to user receiving notification |
| No | No | No | type | varchar | 255 | No | - | Notification type/category |
| No | No | No | title | varchar | 255 | No | - | Notification title |
| No | No | No | message | text | - | No | - | Notification message content |
| No | Yes | No | projectId | varchar | 255 | Yes | - | Reference to related project |
| No | No | No | projectName | varchar | 255 | Yes | - | Name of related project |
| No | No | No | actionUrl | varchar | 255 | Yes | - | URL for notification action |
| No | No | No | read | tinyint | 1 | No | false | Whether notification has been read |
| No | No | No | created_at | datetime | - | No | now() | Timestamp of notification creation |

---

### Table 8. activity

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: activity |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | Yes | No | userId | varchar | 255 | No | - | Reference to user |
| No | No | No | type | enum | - | No | - | Type of activity |
| No | No | No | description | varchar | 255 | No | - | Activity description |
| No | No | No | metadata | longtext | - | Yes | - | Additional activity metadata |
| No | No | No | created_at | datetime | - | No | now() | Activity timestamp |

---

### Table 9. verificationcode

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: verificationcode |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | No | No | code | varchar | 6 | No | - | 6-digit verification code |
| No | Yes | No | email | varchar | 255 | No | - | User email |
| No | No | No | type | varchar | 255 | No | email_verification | Code type |
| No | No | No | expiresAt | datetime | - | No | - | Code expiration |
| No | No | No | used | tinyint | 1 | No | false | Whether code has been used |
| No | No | No | created_at | datetime | - | No | now() | Creation timestamp |

---

### Table 10. ratelimit

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: ratelimit |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | No | No | email | varchar | 255 | No | - | User email |
| No | No | No | action | varchar | 255 | No | otp_generation | Rate limited action |
| No | No | No | attempts | int | 11 | No | 0 | Number of attempts |
| No | No | No | lastAttempt | datetime | - | No | - | Last attempt timestamp |
| No | No | No | blockedUntil | datetime | - | Yes | - | Block expiry timestamp |
| No | No | No | created_at | datetime | - | No | now() | Creation timestamp |
| No | No | No | updated_at | datetime | - | No | - | Last update timestamp |

---

### Table 11. systemsettings

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: systemsettings |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| Yes | No | No | id | varchar | 255 | No | - | Unique identifier |
| No | No | No | maintenanceMode | tinyint | 1 | No | false | Whether system in maintenance |
| No | No | No | maintenanceMessage | text | - | Yes | - | Maintenance message |
| No | No | No | maintenanceScheduledEnd | datetime | - | Yes | - | Scheduled maintenance end |
| No | No | No | maintenanceStartedBy | varchar | 255 | Yes | - | Who started maintenance |
| No | No | No | maintenanceStartedAt | datetime | - | Yes | - | Maintenance start timestamp |
| No | No | No | updated_at | datetime | - | No | - | Last update timestamp |

---

## Enums

### Table 12. activity_type

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: activity_type |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| No | No | No | LOGIN | enum | - | No | - | User login activity |
| No | No | No | LOGOUT | enum | - | No | - | User logout activity |
| No | No | No | PROFILE_UPDATE | enum | - | No | - | Profile modification |
| No | No | No | PASSWORD_CHANGE | enum | - | No | - | Password change activity |
| No | No | No | ACCOUNT_CREATED | enum | - | No | - | Account creation |
| No | No | No | PROJECT_CREATED | enum | - | No | - | Project creation |
| No | No | No | PROJECT_UPDATED | enum | - | No | - | Project modification |
| No | No | No | PAYMENT_RECEIVED | enum | - | No | - | Payment processing |
| No | No | No | EMAIL_VERIFIED | enum | - | No | - | Email verification |

---

### Table 13. ProjectMaterial_status

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: ProjectMaterial_status |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| No | No | No | RESERVED | enum | - | No | - | Material reserved for project |
| No | No | No | CONSUMED | enum | - | No | - | Material consumed/used |
| No | No | No | RETURNED | enum | - | No | - | Material returned to warehouse |
| No | No | No | CANCELLED | enum | - | No | - | Material reservation cancelled |

---

### Table 14. project_status

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: project_status |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| No | No | No | DRAFT | enum | - | No | - | Initial project draft |
| No | No | No | ACTIVE | enum | - | No | - | Active project |
| No | No | No | CLIENT_PENDING | enum | - | No | - | Awaiting client response |
| No | No | No | CONTRACTOR_REVIEWING | enum | - | No | - | Under contractor review |
| No | No | No | PROPOSAL_SENT | enum | - | No | - | Proposal sent to client |
| No | No | No | ACCEPTED | enum | - | No | - | Project accepted |
| No | No | No | IN_PROGRESS | enum | - | No | - | Project in progress |
| No | No | No | COMPLETED | enum | - | No | - | Project completed |
| No | No | No | ARCHIVED | enum | - | No | - | Project archived |
| No | No | No | REJECTED | enum | - | No | - | Project rejected |
| No | No | No | FOR_CLIENT_REVIEW | enum | - | No | - | Pending client review |

---

### Table 15. user_role

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: user_role |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| No | No | No | CLIENT | enum | - | No | - | Standard client user |
| No | No | No | ADMIN | enum | - | No | - | Administrative user |
| No | No | No | DEVELOPER | enum | - | No | - | Developer/technical user |

---

### Table 16. project_constructionMode

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: project_constructionMode |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| No | No | No | NEW | enum | - | No | - | New construction project |
| No | No | No | REPAIR | enum | - | No | - | Repair/maintenance project |

---

### Table 17. project_proposalStatus

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: project_proposalStatus |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| No | No | No | DRAFT | enum | - | No | - | Initial proposal draft |
| No | No | No | SENT | enum | - | No | - | Proposal sent to client |
| No | No | No | ACCEPTED | enum | - | No | - | Proposal accepted |
| No | No | No | REJECTED | enum | - | No | - | Proposal rejected |
| No | No | No | REVISED | enum | - | No | - | Proposal revised |
| No | No | No | COMPLETED | enum | - | No | - | Proposal completed |

---

### Table 18. project_currentStage

| Data Dictionary | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | Reference Number: | |
| | | | | | | | Version Number: | |
| System Name: RoofCalc: Professional Roofing Estimation and Project Management System |
| Subject: project_currentStage |
| PK | FK | AK | Field Name | Data | Length | Nullable | Default | Description |
|---|---|---|---|---|---|---|---|---|
| No | No | No | INSPECTION | enum | - | No | - | Initial inspection stage |
| No | No | No | ESTIMATE | enum | - | No | - | Cost estimation stage |
| No | No | No | MATERIALS | enum | - | No | - | Material procurement stage |
| No | No | No | INSTALL | enum | - | No | - | Installation stage |
| No | No | No | FINALIZE | enum | - | No | - | Project finalization |

---

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

