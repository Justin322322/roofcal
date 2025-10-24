# Project Cancellation Feature

## Overview
This feature allows both clients and contractors (admins) to cancel projects that have been accepted or are in progress.

## Status Flow
- Projects can only be cancelled when in `ACCEPTED` or `IN_PROGRESS` status
- When cancelled, the project status changes to `CANCELLED`
- The proposal status is set to `REJECTED`

## User Permissions

### Client Cancellation
- Clients can cancel their own projects that are `ACCEPTED` or `IN_PROGRESS`
- When a client cancels:
  - The contractor receives an email notification
  - An in-app notification is created for the contractor
  - The cancellation reason is recorded in the project notes

### Contractor (Admin) Cancellation
- Contractors can cancel projects assigned to them that are `ACCEPTED` or `IN_PROGRESS`
- When a contractor cancels:
  - The client receives an email notification
  - An in-app notification is created for the client
  - The cancellation reason is recorded in the project notes

## UI Components

### Client Side (My Projects)
- Cancel button appears in the project dropdown menu for `ACCEPTED` and `IN_PROGRESS` projects
- Clicking "Cancel Project" opens a dialog requiring a cancellation reason
- The reason is mandatory before cancellation can proceed

### Contractor Side (Assigned Projects)
- Cancel button appears in the project dropdown menu for `ACCEPTED` and `IN_PROGRESS` projects
- Clicking "Cancel Project" opens a dialog requiring a cancellation reason
- The reason is mandatory before cancellation can proceed

## API Endpoint

### POST `/api/projects/[id]/cancel`

**Request Body:**
```json
{
  "reason": "Reason for cancellation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project cancelled successfully",
  "project": { ... }
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Unauthorized (not client or contractor)
- `404` - Project not found
- `400` - Project status doesn't allow cancellation
- `500` - Server error

## Database Changes

### Schema Update
Added `CANCELLED` to the `project_status` enum:
```prisma
enum project_status {
  DRAFT
  ACTIVE
  CLIENT_PENDING
  CONTRACTOR_REVIEWING
  PROPOSAL_SENT
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  ARCHIVED
  REJECTED
  FOR_CLIENT_REVIEW
  CANCELLED  // New status
}
```

### Migration
Run the following to apply the schema changes:
```bash
npx prisma db push
npx prisma generate
```

## Notifications

### Email Notifications
Both parties receive professional email notifications with:
- Project name
- Cancellation reason (if provided)
- Link to view their projects
- Support contact information

### In-App Notifications
Notifications are created with:
- Type: `PROJECT_CANCELLED`
- Title: "Project Cancelled by [Client/Contractor]"
- Message: Project name and reason
- Action URL: Link to relevant project list

## Notes
- Cancellation reasons are appended to the project notes field
- The cancellation is permanent and cannot be undone
- Cancelled projects appear in filtered views with the `CANCELLED` status badge
- Material reservations (if any) should be handled separately based on business logic
