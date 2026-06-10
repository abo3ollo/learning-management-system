# Learning Management System - Feature Implementation Guide

## Overview

This document describes the complete implementation of user authentication, role management, and approval workflow in the LMS application.

## Architecture Overview

```
User Flow:
1. Clerk Auth (Sign Up/Sign In)
   ↓
2. ConvexClerkProvider (UserSync Component)
   ↓
3. Check if user exists in Convex DB
   ├─ YES: Continue to dashboard based on status
   └─ NO: Redirect to /onboarding
   ↓
4. /onboarding (Role Selection)
   ↓
5. Create user in Convex with selected role + pending status
   ↓
6. /pending-approval (Wait for admin)
   ↓
7. Admin approves at /admin/approvals
   ↓
8. Redirect to role-specific dashboard
   ├─ admin → /admin
   ├─ teacher → /teacher
   ├─ student → /student
   └─ parent → /parent
```

## 1. User Sync (ConvexClerkProvider)

**File:** `app/_components/ConvexClerkProvider.tsx`

The UserSync component automatically redirects new users to the onboarding flow:

- Checks if user is authenticated via Clerk
- Queries Convex database for existing user record
- If user doesn't exist: redirects to `/onboarding`
- If user exists: allows access to app
- Skips redirect on specific pages (onboarding, pending-approval, etc.)

```typescript
// Component checks:
const currentUser = useQuery(api.user.getCurrentUser);

if (!currentUser && user) {
  router.push("/onboarding"); // Redirect new users
}
```

## 2. Role Selection

**Files:**
- `app/_components/RoleSelector.tsx` - Role selection UI component
- `app/onboarding/page.tsx` - Onboarding page

### Features:
- Visual role selection with 4 options:
  - 👨‍🎓 Student
  - 👨‍🏫 Teacher
  - 👨‍👩‍👧 Parent
  - ⚙️ Admin

- Upon selection, calls `createUser` mutation with:
  - Clerk ID
  - Name
  - Email
  - Selected role
  - Status: `pending` (automatic)

- Redirects to `/pending-approval`

```typescript
await createUser({
  clerkId: user.id,
  name: user.fullName || "User",
  email: primaryEmail,
  role: selectedRole, // user's choice
});
```

## 3. Pending Approval Flow

**Files:**
- `app/pending-approval/page.tsx` - Pending approval page
- `app/account-rejected/page.tsx` - Rejection page

### User States:
1. **Pending** - Waiting for admin approval
   - Shows status badge
   - Displays user information
   - Can sign out and check back later

2. **Approved** - Redirects to dashboard
   - Admin approved the registration
   - User can now access their role-specific features

3. **Rejected** - Shows rejection reason
   - Admin rejected the registration
   - User sees reason for rejection
   - Option to contact support

### Status Lifecycle:
```
pending → approved → [dashboard]
       → rejected  → [account-rejected]
```

## 4. Protected Routes

**File:** `middleware.ts`

Clerk middleware ensures proper route protection:

```typescript
// Public routes (no auth required)
- / (home)
- /sign-in
- /sign-up

// Auth-required routes (user must be signed in)
- /onboarding
- /pending-approval
- /account-rejected
- /dashboard
- /admin (role-specific)
- /teacher (role-specific)
- /student (role-specific)
- /parent (role-specific)
```

**Additional Protection:**
- Individual pages check user role via Convex queries
- Unauthorized users are redirected to `/dashboard`
- `/dashboard` intelligently redirects based on user status

### Dashboard Routing Logic:
```typescript
if (status === "pending") → /pending-approval
if (status === "approved") → /admin|/teacher|/student|/parent
if (status === "rejected") → /account-rejected
if (status === undefined) → /onboarding
```

## 5. Admin Approval Dashboard

**Files:**
- `app/admin/layout.tsx` - Admin sidebar layout
- `app/admin/page.tsx` - Admin dashboard home
- `app/admin/approvals/page.tsx` - User approval management

### Admin Features:

**Dashboard:**
- Pending approvals count
- System status indicator
- Quick action cards

**Approvals Page:**
- Lists all pending user registrations
- Displays user info (name, email, phone, role, registration date)
- Approve button - marks user as approved
- Reject button - marks user as rejected with optional reason
- Audit logging on all actions

### Admin Navigation:
```
📚 LMS Admin
├─ Dashboard (overview stats)
├─ User Approvals (pending reviews)
├─ All Users (future: user management)
└─ Settings (future: platform config)
```

### Approval Mutations:
```typescript
// Approve user
await approveUser({ 
  userId: string,
  role?: Role // optional role change during approval
});

// Reject user
await rejectUser({ 
  userId: string,
  reason?: string
});
```

## Database Schema

### Users Table
```typescript
{
  clerkId: string              // Clerk user ID
  name: string                 // User's full name
  email: string                // Email address
  phoneNumber?: string         // Optional phone
  role: "student" | "teacher" | "parent" | "admin"
  status: "pending" | "approved" | "rejected"
  rejectionReason?: string     // Why user was rejected
  approvedAt?: number          // Timestamp of approval
  approvedBy?: Id<"users">     // Admin who approved
  createdAt: number            // Registration timestamp
  updatedAt?: number           // Last update timestamp
}

Indexes:
- by_clerkId (for auth lookups)
- by_email (prevent duplicates)
- by_status (admin approval queries)
- by_role (role-based features)
```

### Audit Logs Table
```typescript
{
  userId: Id<"users">          // Who performed the action
  action: string               // e.g., "APPROVE_USER", "REJECT_USER"
  resourceType: string         // "user", etc.
  resourceId: string           // ID of affected resource
  details: {                   // Contextual data
    role?: string
    email?: string
    previousStatus?: string
    reason?: string
    // ... other context
  }
  createdAt: number
}

Indexes:
- by_userId (user's action history)
- by_resourceId (resource change history)
```

### Parent-Student Links Table (Future Use)
```typescript
{
  parentId: Id<"users">
  studentId: Id<"users">
  createdAt: number
}

Indexes:
- by_parent_student (unique link lookup)
- by_parent (all children of parent)
- by_student (all parents of student)
```

## File Structure

```
app/
├─ page.tsx                    # Home page (public)
├─ layout.tsx                  # Root layout with providers
├─ dashboard/
│  └─ page.tsx                # Dashboard redirect/fallback
├─ onboarding/
│  └─ page.tsx                # Role selection page
├─ pending-approval/
│  └─ page.tsx                # Approval waiting page
├─ account-rejected/
│  └─ page.tsx                # Rejection page
├─ admin/
│  ├─ layout.tsx              # Admin sidebar layout
│  ├─ page.tsx                # Dashboard overview
│  ├─ approvals/
│  │  └─ page.tsx             # Approval management
│  ├─ users/
│  │  └─ page.tsx             # User management (TODO)
│  └─ settings/
│     └─ page.tsx             # Platform settings (TODO)
├─ teacher/
│  └─ page.tsx                # Teacher dashboard
├─ student/
│  └─ page.tsx                # Student dashboard
├─ parent/
│  └─ page.tsx                # Parent dashboard
└─ _components/
   ├─ ConvexClerkProvider.tsx # Auth provider setup
   └─ RoleSelector.tsx         # Role selection UI

convex/
├─ schema.ts                   # Database schema
├─ user.ts                     # User management functions
├─ auth.config.ts             # Clerk auth config
└─ _generated/
   └─ api.d.ts                # Generated Convex API types
```

## Key Convex Queries & Mutations

### Queries
```typescript
// Get current authenticated user
api.user.getCurrentUser() → User | null

// Get user by ID (with access control)
api.user.getUserById(userId) → User | null

// List all pending registrations (admin only)
api.user.getPendingRegistrations() → User[]

// Check current registration status
api.user.checkRegistrationStatus() → User | null
```

### Mutations
```typescript
// Create user from registration
api.user.createUser({
  clerkId: string,
  name: string,
  email: string,
  role: Role,
  phoneNumber?: string
}) → userId

// Approve pending user (admin)
api.user.approveUser({
  userId: Id<"users">,
  role?: Role  // optional change role during approval
}) → { success: true }

// Reject pending user (admin)
api.user.rejectUser({
  userId: Id<"users">,
  reason?: string
}) → { success: true }

// Update user role (admin)
api.user.updateUserRole({
  userId: Id<"users">,
  role: Role
}) → { success: true }
```

## Security & Validation

### Authentication
- Clerk handles user authentication
- ConvexClerkProvider integrates Clerk with Convex
- All mutations require valid Clerk identity

### Authorization
- `getCurrentUser()` checks Clerk auth
- Admin queries check for `role === "admin"`
- Parent access checks for parent-student relationships
- Approval actions log all changes to audit table

### Validation
- All Convex functions use `v` validators
- Email uniqueness enforced
- Prevent duplicate user creation
- Role selection limited to 4 specific values

## Deployment Checklist

- [ ] Configure Clerk keys (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
- [ ] Configure Convex deployment URL (NEXT_PUBLIC_CONVEX_URL)
- [ ] Configure Clerk JWT issuer domain (CLERK_JWT_ISSUER_DOMAIN)
- [ ] Run `npx convex dev` to start local development
- [ ] Test registration flow end-to-end
- [ ] Test admin approval workflow
- [ ] Test role-specific dashboard access
- [ ] Deploy to production

## Testing Scenarios

### New User Registration
1. Visit home page
2. Click "Sign In" → Complete Clerk signup
3. Auto-redirect to /onboarding
4. Select role and submit
5. See pending approval page

### Admin Approval
1. Login as admin user
2. Navigate to /admin/approvals
3. Review pending users
4. Approve or reject with optional reason
5. User sees updated status (approved/rejected)

### Invalid Access
1. Try accessing /admin as non-admin
2. Try accessing /admin/approvals before approval
3. Try accessing role-specific dashboard with wrong role
4. All should redirect appropriately

## Future Enhancements

- [ ] Email notifications on approval/rejection
- [ ] Bulk user import/management
- [ ] User search and filtering
- [ ] Role change requests
- [ ] Activity audit dashboard
- [ ] System-wide settings management
- [ ] Two-factor authentication
- [ ] Account deactivation
