# Fix Help Request and Contractor Project Creation Workflows

## Problems Identified

1. **Help Request Dialog** - Works correctly but messages could be clearer
2. **Contractor Project Creation** - Misleading messages about "client review" when project should be immediately active
3. **Status Transitions** - Inconsistent project status changes causing UI confusion
4. **Send to Contractor** - Needs better context to distinguish from contractor creating on behalf of client

## Proposed Solution

### Clear Workflow Design

**Help Request Flow (Client → Contractor)**:

1. Client clicks "Request Help" 
2. Selects a contractor from list
3. Contractor receives notification with direct link
4. Contractor creates project on client's behalf
5. Project created with status `FOR_CLIENT_REVIEW` for client approval
6. Client receives notification to review and approve project proposal
7. Client can approve or reject the proposal
8. If approved: FOR_CLIENT_REVIEW → ACCEPTED → IN_PROGRESS → COMPLETED
9. If rejected: Client can request revisions or select different contractor

**Contractor Project Creation Flow (Full Lifecycle)**:

1. Contractor selects client
2. Contractor uses calculator to create project
3. Project created with status `FOR_CLIENT_REVIEW` for client approval
4. Client receives notification to review and approve project proposal
5. Client reviews project details, costs, and specifications
6. Client can approve or reject the proposal
7. If approved: FOR_CLIENT_REVIEW → ACCEPTED → IN_PROGRESS → COMPLETED
8. If rejected: Client can request revisions or contractor can modify

**Send to Contractor Flow** (separate - for client-created drafts):

1. Client creates draft project themselves
2. Client sends to contractor for review/proposal
3. Status changes to `CONTRACTOR_REVIEWING`
4. Contractor can accept/reject and create proposal
5. If accepted: CONTRACTOR_REVIEWING → ACCEPTED → IN_PROGRESS → COMPLETED
6. If rejected: Client can revise or select different contractor

## Implementation Changes

### 1. Fix Help Request Dialog
**File**: `src/components/help-request-dialog.tsx`

Lines to update:
- Line 148: "Request Contractor Help" ✓ (already correct)
- Line 151-153: Update description to clarify contractor will create project for them
- Line 225-231: Update "What happens next" to say "contractor will create a project proposal for you to review"

### 2. Fix Contractor Project Creation Module
**File**: `src/app/dashboard/(sections)/admin-project-creation.tsx`

Critical fixes:
- Line 98: Keep "sent to the client for review and approval" ✓ (this is correct)
- Line 111: Keep "client will receive a notification to review and approve it" ✓ (this is correct)
- Line 214: Update banner text to be consistent with review process
- Lines 359-360: Change step 3 from "Project activation" to "Client review" with "client reviews and approves proposal"

### 3. Fix Project Creation Action
**File**: `src/app/dashboard/roof-calculator/actions/index.ts`

Update `saveProjectForCustomer` function (lines 261-400):
- Line 366: Change status logic to use `FOR_CLIENT_REVIEW` for contractor-created projects
- Keep `FOR_CLIENT_REVIEW` status for proper client approval flow
- Line 374-377: Update notification call to reflect review process

### 4. Update Help Request API
**File**: `src/app/api/help-request/route.ts`

- Line 68: Update notification message to be clearer about the workflow
- Keep "needs assistance with creating a project" wording
- Ensure action URL properly links to project creation with client context

### 5. Clarify "Send to Contractor" Feature
**File**: `src/app/dashboard/roof-calculator/components/project-list.tsx`

- Line 702-711: Keep feature as-is but only show for client-owned DRAFT projects
- Add condition to hide if project was created by contractor (check for createdByAdmin flag)
- This distinguishes contractor-created projects from client-created drafts

### 6. Update Notification Messages
**File**: `src/lib/notifications.ts`

Update `notifyCustomerProjectCreated` function (around line 488):
- Keep message about "review and approve" ✓ (this is correct)
- Update title to "Project Proposal Ready for Review"
- Make action URL point to project review page

### 7. Update Status Badge Logic
**File**: `src/lib/badge-utils.tsx`

- Ensure `FOR_CLIENT_REVIEW` status badge is properly displayed
- Make sure it's used in contractor creation flow
- Keep status transitions clean and predictable

## Key Changes Summary

### Status Flow with Client Review
- **Contractor creates for client**: FOR_CLIENT_REVIEW → ACCEPTED → IN_PROGRESS → COMPLETED
- **Client creates draft**: DRAFT → can send to contractor → CONTRACTOR_REVIEWING → ACCEPTED → IN_PROGRESS → COMPLETED
- **Keep**: FOR_CLIENT_REVIEW status for contractor creation flow

### Messaging Improvements
- Clear that contractor-created projects need client review and approval
- Consistent "review and approve" language throughout
- Client receives "project proposal ready for review" notification

### User Experience
- Contractor creates → Client reviews and approves → Project becomes active
- Client creates draft → Can optionally send to contractor for quote
- Clear distinction between the two workflows
- Proper client approval step for contractor-created projects

## Files to Modify

1. `src/components/help-request-dialog.tsx` - Clarify workflow description
2. `src/app/dashboard/(sections)/admin-project-creation.tsx` - Keep review messaging but make it consistent
3. `src/app/dashboard/roof-calculator/actions/index.ts` - Set status to FOR_CLIENT_REVIEW
4. `src/app/api/help-request/route.ts` - Keep notification clear
5. `src/app/dashboard/roof-calculator/components/project-list.tsx` - Conditional display logic
6. `src/lib/notifications.ts` - Update notification messages to be clearer
7. `src/lib/badge-utils.tsx` - Ensure FOR_CLIENT_REVIEW status is properly handled

### To-dos

- [ ] Update help request dialog description to clarify contractor will create project proposal for review
- [ ] Make contractor project creation messaging consistent about client review process
- [ ] Update saveProjectForCustomer to create FOR_CLIENT_REVIEW projects for proper approval flow
- [ ] Update help request API notification messages to be clearer about workflow
- [ ] Update customer notification to say "project proposal ready for review"
- [ ] Add condition to hide 'Send to Contractor' for contractor-created projects
- [ ] Test complete workflows: help request → contractor creation → client review → approval
