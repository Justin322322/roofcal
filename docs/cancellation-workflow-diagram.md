# Project Cancellation Workflow Diagram

## Cancellation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECT CANCELLATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   ACCEPTED   │
                    │      or      │
                    │ IN_PROGRESS  │
                    └──────┬───────┘
                           │
                           │ User clicks "Cancel Project"
                           │
                    ┌──────▼───────┐
                    │ Cancel Dialog│
                    │   Opens      │
                    └──────┬───────┘
                           │
                           │ User enters reason (mandatory)
                           │
                    ┌──────▼───────┐
                    │ POST Request │
                    │ to API       │
                    └──────┬───────┘
                           │
                ┌──────────▼──────────┐
                │  Permission Check   │
                │  - Is Client?       │
                │  - Is Contractor?   │
                │  - Is Admin?        │
                └──────────┬──────────┘
                           │
                    ┌──────▼───────┐
                    │ Status Check │
                    │ ACCEPTED or  │
                    │ IN_PROGRESS? │
                    └──────┬───────┘
                           │
                ┌──────────▼──────────┐
                │  Update Database    │
                │  - status: CANCELLED│
                │  - proposalStatus:  │
                │    REJECTED         │
                │  - Add notes        │
                └──────────┬──────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
    ┌───────▼────────┐          ┌────────▼────────┐
    │ Send Email     │          │ Create In-App   │
    │ Notification   │          │ Notification    │
    │ to Other Party │          │ to Other Party  │
    └───────┬────────┘          └────────┬────────┘
            │                             │
            └──────────────┬──────────────┘
                           │
                    ┌──────▼───────┐
                    │ Return Success│
                    │ to Frontend  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Update UI    │
                    │ Show Toast   │
                    │ Close Dialog │
                    └──────────────┘
```

## Client Cancellation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT CANCELS PROJECT                        │
└─────────────────────────────────────────────────────────────────┘

    CLIENT                    SYSTEM                    CONTRACTOR
      │                         │                           │
      │  1. Clicks Cancel       │                           │
      ├────────────────────────>│                           │
      │                         │                           │
      │  2. Enters Reason       │                           │
      ├────────────────────────>│                           │
      │                         │                           │
      │                         │ 3. Validates              │
      │                         │    Permissions            │
      │                         │                           │
      │                         │ 4. Updates DB             │
      │                         │    CANCELLED              │
      │                         │                           │
      │                         │ 5. Send Email             │
      │                         ├──────────────────────────>│
      │                         │                           │
      │                         │ 6. Create Notification    │
      │                         ├──────────────────────────>│
      │                         │                           │
      │  7. Success Response    │                           │
      │<────────────────────────┤                           │
      │                         │                           │
      │  8. Toast: "Cancelled"  │                           │
      │                         │                           │
      │                         │    9. Contractor sees     │
      │                         │       notification        │
      │                         │<──────────────────────────┤
```

## Contractor Cancellation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  CONTRACTOR CANCELS PROJECT                      │
└─────────────────────────────────────────────────────────────────┘

  CONTRACTOR                  SYSTEM                      CLIENT
      │                         │                           │
      │  1. Clicks Cancel       │                           │
      ├────────────────────────>│                           │
      │                         │                           │
      │  2. Enters Reason       │                           │
      ├────────────────────────>│                           │
      │                         │                           │
      │                         │ 3. Validates              │
      │                         │    Permissions            │
      │                         │                           │
      │                         │ 4. Updates DB             │
      │                         │    CANCELLED              │
      │                         │                           │
      │                         │ 5. Send Email             │
      │                         ├──────────────────────────>│
      │                         │                           │
      │                         │ 6. Create Notification    │
      │                         ├──────────────────────────>│
      │                         │                           │
      │  7. Success Response    │                           │
      │<────────────────────────┤                           │
      │                         │                           │
      │  8. Toast: "Cancelled"  │                           │
      │                         │                           │
      │                         │    9. Client sees         │
      │                         │       notification        │
      │                         │<──────────────────────────┤
```

## Permission Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHO CAN CANCEL WHAT                           │
└─────────────────────────────────────────────────────────────────┘

User Role    │ Can Cancel Own Projects │ Can Cancel Assigned Projects
─────────────┼─────────────────────────┼──────────────────────────────
CLIENT       │         ✅ YES          │           ❌ NO
CONTRACTOR   │         ✅ YES          │           ✅ YES
ADMIN        │         ✅ YES          │           ✅ YES

Status       │ Can Be Cancelled
─────────────┼──────────────────
DRAFT        │     ❌ NO
ACTIVE       │     ❌ NO
PENDING      │     ❌ NO
REVIEWING    │     ❌ NO
ACCEPTED     │     ✅ YES
IN_PROGRESS  │     ✅ YES
COMPLETED    │     ❌ NO
REJECTED     │     ❌ NO
ARCHIVED     │     ❌ NO
CANCELLED    │     ❌ NO
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE UPDATES                              │
└─────────────────────────────────────────────────────────────────┘

BEFORE CANCELLATION:
┌──────────────────────────────────────┐
│ project                              │
├──────────────────────────────────────┤
│ id: "abc123"                         │
│ status: "ACCEPTED"                   │
│ proposalStatus: "ACCEPTED"           │
│ notes: "Original notes"              │
│ clientId: "client-1"                 │
│ contractorId: "contractor-1"         │
└──────────────────────────────────────┘

AFTER CANCELLATION (by client):
┌──────────────────────────────────────┐
│ project                              │
├──────────────────────────────────────┤
│ id: "abc123"                         │
│ status: "CANCELLED" ◄─── UPDATED     │
│ proposalStatus: "REJECTED" ◄─ UPDATED│
│ notes: "Original notes               │
│                                      │
│ Cancelled by client (John Doe):     │
│ Budget constraints" ◄─── APPENDED   │
│ clientId: "client-1"                 │
│ contractorId: "contractor-1"         │
└──────────────────────────────────────┘

NEW NOTIFICATION CREATED:
┌──────────────────────────────────────┐
│ notification                         │
├──────────────────────────────────────┤
│ id: "notif-xyz"                      │
│ userId: "contractor-1" ◄─ RECIPIENT  │
│ type: "PROJECT_CANCELLED"            │
│ title: "Project Cancelled by Client" │
│ message: "Project XYZ cancelled..."  │
│ projectId: "abc123"                  │
│ read: false                          │
│ created_at: "2024-10-24T..."         │
└──────────────────────────────────────┘
```

## UI Component Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    UI COMPONENT HIERARCHY                        │
└─────────────────────────────────────────────────────────────────┘

ProjectList / ContractorProjects
    │
    ├── Table
    │   └── TableRow (for each project)
    │       └── DropdownMenu
    │           ├── View Details
    │           ├── Edit
    │           ├── Cancel Project ◄─── NEW
    │           └── Archive
    │
    └── Dialogs
        ├── ViewDialog
        ├── EditDialog
        ├── CancelDialog ◄─── NEW
        │   ├── DialogHeader
        │   │   ├── Title: "Cancel Project"
        │   │   └── Description
        │   ├── DialogContent
        │   │   └── Textarea (reason input)
        │   └── DialogFooter
        │       ├── Close Button
        │       └── Cancel Button (red)
        └── ArchiveDialog
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                                │
└─────────────────────────────────────────────────────────────────┘

Request
   │
   ├─► No Auth Token
   │   └─► 401 Unauthorized
   │       └─► Toast: "Authentication required"
   │
   ├─► Not Client/Contractor
   │   └─► 403 Forbidden
   │       └─► Toast: "Unauthorized"
   │
   ├─► Project Not Found
   │   └─► 404 Not Found
   │       └─► Toast: "Project not found"
   │
   ├─► Wrong Status
   │   └─► 400 Bad Request
   │       └─► Toast: "Only accepted or in-progress projects can be cancelled"
   │
   ├─► No Reason Provided
   │   └─► Client-side validation
   │       └─► Button disabled
   │
   ├─► Network Error
   │   └─► 500 Server Error
   │       └─► Toast: "Failed to cancel project"
   │
   └─► Success
       └─► 200 OK
           └─► Toast: "Project cancelled successfully"
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT STATE                               │
└─────────────────────────────────────────────────────────────────┘

Component State Variables:
┌────────────────────────────────────┐
│ cancelDialogOpen: boolean          │ ◄─ Controls dialog visibility
│ projectToCancel: string | null     │ ◄─ Stores project ID
│ cancelReason: string               │ ◄─ Stores user input
│ cancellingProjectId: string | null │ ◄─ Loading state
└────────────────────────────────────┘

State Flow:
1. User clicks "Cancel Project"
   └─► projectToCancel = project.id
   └─► cancelDialogOpen = true

2. User types reason
   └─► cancelReason = "user input"

3. User clicks "Cancel Project" button
   └─► cancellingProjectId = projectToCancel
   └─► API call initiated

4. API responds
   └─► cancellingProjectId = null
   └─► cancelDialogOpen = false
   └─► projectToCancel = null
   └─► cancelReason = ""
   └─► projects list updated
```
