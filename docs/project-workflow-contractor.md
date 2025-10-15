# Contractor Project Workflow

## Overview
This document describes the complete workflow for contractor-managed projects from creation to completion.

## Workflow Stages

### 1. Admin Creates Project for Client
- **Status**: `FOR_CLIENT_REVIEW`
- **Action**: Admin (contractor) creates a project and assigns it to a client
- **Next Step**: Client reviews and approves/rejects

### 2. Client Reviews Project
- **Status**: `FOR_CLIENT_REVIEW`
- **Actions Available**:
  - **Approve**: Client accepts the project proposal
  - **Reject**: Client declines the project proposal
- **Next Step**: 
  - If approved → Status becomes `ACTIVE`
  - If rejected → Status becomes `REJECTED`

### 3. Project Accepted by Client
- **Status**: `ACTIVE` (changed from `ACCEPTED`)
- **ProposalStatus**: `ACCEPTED`
- **Visible In**: Contractor Projects Dashboard (`/dashboard?tab=contractor-projects`)
- **Actions Available**:
  - **Start Work**: Contractor begins work on the project (transitions to IN_PROGRESS)
  - **Complete Project**: Contractor can also directly mark as completed without starting
  - **View Details**: View full project information
- **Next Step**: Contractor starts work or completes the project

### 4. Project In Progress
- **Status**: `IN_PROGRESS`
- **Visible In**: Contractor Projects Dashboard (`/dashboard?tab=contractor-projects`)
- **Actions Available**:
  - **Complete Project**: Contractor marks the project as completed
  - **View Details**: View full project information
- **Next Step**: Contractor completes the work and marks project as completed

### 5. Project Completed
- **Status**: `COMPLETED`
- **ProposalStatus**: `COMPLETED`
- **Action**: Contractor has finished the work
- **Result**: Client receives notification of completion

## API Endpoints

### Client Approval
- **Endpoint**: `PUT /api/projects/[id]/approve`
- **Body**: `{ "action": "approve" | "reject" }`
- **Auth**: Client only
- **Result**: Updates status to `ACTIVE` or `REJECTED`

### Contractor Start Work
- **Endpoint**: `PATCH /api/projects/[id]`
- **Body**: `{ "status": "IN_PROGRESS" }`
- **Auth**: Assigned contractor only
- **Result**: Updates status to `IN_PROGRESS`

### Contractor Completion
- **Endpoint**: `POST /api/projects/[id]/finish`
- **Auth**: Assigned contractor only
- **Result**: Updates status to `COMPLETED`

## Contractor Dashboard Filters

### Status Filters
- **All**: Shows all assigned projects (excludes DRAFT)
- **Reviewing**: Shows `CONTRACTOR_REVIEWING` status
- **Client Review**: Shows `FOR_CLIENT_REVIEW` status
- **Accepted**: Shows `ACCEPTED`, `ACTIVE`, or `DRAFT` status with `ACCEPTED` proposal
- **In Progress**: Shows `IN_PROGRESS` status
- **Completed**: Shows `COMPLETED` status
- **Rejected**: Shows `REJECTED` status
- **Archived**: Shows `ARCHIVED` status

### Project Visibility
Contractors see projects where:
- `contractorId` matches their user ID
- Status is NOT `DRAFT` (unless they created it)

## Notifications

### When Client Approves
- Contractor receives notification: "Project Approved by Client"
- Notification links to: `/dashboard?tab=contractor-projects`

### When Contractor Completes
- Client receives notification: "Project Completed"
- Email notification sent to client

## Troubleshooting

### "Can't see accepted projects"
1. Check filter is set to "Accepted" or "All"
2. Verify project `contractorId` matches your user ID
3. Verify project status is `ACCEPTED`
4. Clear browser cache and refresh

### "Can't complete project"
1. Verify project status is `ACCEPTED`, `ACTIVE`, or `DRAFT`
2. Verify you are the assigned contractor
3. Check for "Complete Project" button in actions column
4. If button is disabled, check for loading state

### "Project not showing after client approval"
1. Refresh the page (cache may be stale)
2. Check API response: `GET /api/contractor/projects`
3. Verify notification was received
4. Check project status in database

