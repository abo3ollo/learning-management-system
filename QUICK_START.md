# Quick Start Guide - LMS Features

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Clerk account configured (with keys in .env.local)
- Convex project set up

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Start Convex Development
```bash
npx convex dev
```

Visit `http://localhost:3000` to start testing.

---

## Feature Testing Guide

### Test 1: User Registration & Role Selection

1. **Start fresh** (delete Clerk session if needed)
2. **Navigate** to `http://localhost:3000`
3. **Click** "Sign In" button
4. **Complete** Clerk signup
5. **Auto-redirect** to `/onboarding` page
6. **Select** a role (Student, Teacher, Parent, or Admin)
7. **Click** "Continue"
8. **Confirm** redirect to `/pending-approval`

✅ **Expected:** User created in Convex with status="pending"

---

### Test 2: Admin Approval Workflow

#### Setup
First, create an admin account:

1. **Sign up** as a new user
2. **Open** Convex dashboard or use direct DB query
3. **Update** your user record: set `role: "admin"` and `status: "approved"`

#### Test Approval
1. **Login** as admin (approved)
2. **Navigate** to `/admin/approvals`
3. **View** pending user registrations
4. **Click** "Approve" on a pending user
5. **See** success message
6. **User refreshes** their page → redirected to their role dashboard

✅ **Expected:** User status changes from "pending" to "approved"

#### Test Rejection
1. **On** `/admin/approvals`
2. **Enter** rejection reason in textarea
3. **Click** "Reject"
4. **See** success message
5. **Rejected user** sees `/account-rejected` page with reason

✅ **Expected:** User status changes to "rejected" with reason stored

---

### Test 3: Protected Routes

#### Test Permission Denied
1. **Login** as **student**
2. **Try** navigating to `/admin`
3. **Should redirect** to `/dashboard`

✅ **Expected:** Non-admin cannot access admin pages

#### Test Status Check
1. **Create** new user account
2. **While status="pending"**, try accessing `/student` or `/teacher`
3. **Should redirect** to `/pending-approval`

✅ **Expected:** Unapproved users cannot access role dashboards

#### Test Approved Access
1. **Admin approves** your account
2. **Refresh** your browser
3. **Auto-redirect** to your role dashboard
4. **Can navigate** `/dashboard` → `/student` (if student)

✅ **Expected:** Approved users can access their dashboards

---

### Test 4: Different Role Dashboards

Test each role's dashboard:

**Student Dashboard** (`/student`)
- Shows enrolled courses, GPA, pending assignments
- Sign out button available

**Teacher Dashboard** (`/teacher`)
- Shows your courses, total students, pending assignments
- Sign out button available

**Parent Dashboard** (`/parent`)
- Shows children, active courses, average GPA
- Sign out button available

**Admin Dashboard** (`/admin`)
- Overview stats
- Quick action cards
- Sidebar navigation to approvals, users, settings

✅ **Expected:** Each role sees appropriate content

---

### Test 5: Navigation & Redirects

| Scenario | Action | Expected Result |
|----------|--------|-----------------|
| Signed out on `/admin` | N/A | Redirect to Clerk signin |
| Signed in but pending on `/` | Auto-check | Redirect to `/onboarding` |
| Pending status, try `/student` | Navigate | Redirect to `/pending-approval` |
| Approved as student, try `/admin` | Navigate | Redirect to `/dashboard` |
| Approved as admin, visit `/admin` | Navigate | Show admin dashboard |
| Click sign out | Sign out | Return to home page |

---

## Database Inspection (Convex Dashboard)

### View Created Users
1. Open [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Go to **Data** tab
4. Click **users** table
5. See all registered users with their:
   - Name, email, phone
   - Role (student/teacher/parent/admin)
   - Status (pending/approved/rejected)
   - Approval timestamps

### View Audit Logs
1. In Convex dashboard **Data** tab
2. Click **auditLogs** table
3. See all actions:
   - User registrations
   - Approvals/rejections
   - Who performed action
   - When it happened

---

## Common Issues & Solutions

### Issue: Redirect loop on `/onboarding`
**Cause:** User exists but `getCurrentUser` query keeps returning undefined
**Solution:** Clear browser cache, hard refresh (Ctrl+Shift+R)

### Issue: "Property 'users' does not exist" error
**Cause:** Old API reference `api.users.*` instead of `api.user.*`
**Solution:** Already fixed in codebase, run `npx convex dev` to regenerate types

### Issue: Admin can't see approvals page
**Cause:** User role not set to "admin" or status not "approved"
**Solution:** Manually update user in Convex dashboard with correct role/status

### Issue: Can't sign in with Clerk
**Cause:** Missing environment variables
**Solution:** Ensure `.env.local` has:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CONVEX_URL`

---

## Email Notifications (Future Feature)

Currently, users are NOT notified via email when:
- Their account is approved
- Their account is rejected

To add this, you'll need to:
1. Create an action in Convex to send emails
2. Call it from `approveUser` and `rejectUser` mutations
3. Configure email service (SendGrid, Resend, etc.)

---

## Customization Examples

### Change Role Options
Edit `app/_components/RoleSelector.tsx`:
```typescript
const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "student",
    label: "Student", // Change this
    description: "...", // Change this
    icon: "👨‍🎓", // Change this
  },
  // ... more roles
];
```

### Change Approval Requirements
In `convex/schema.ts`, adminSettings table:
```typescript
adminSettings: defineTable({
  requireApproval: v.boolean(), // Set to false for auto-approval
  autoApproveRoles: v.array(v.string()), // Auto-approve certain roles
  // ...
}),
```

### Custom Redirect After Approval
Edit `app/_components/ConvexClerkProvider.tsx`:
```typescript
const dashboardMap: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher/courses", // Custom path
  student: "/student/learn", // Custom path
  parent: "/parent/children", // Custom path
};
```

---

## Next Steps

### Phase 2 Features (Recommended)
- [ ] Email notifications on approval
- [ ] User profile completion during registration
- [ ] Bulk CSV user import for admins
- [ ] Resend registration link if rejected
- [ ] Admin user search and filter
- [ ] Activity audit logs dashboard
- [ ] Role change requests

### Phase 3 Features
- [ ] Two-factor authentication
- [ ] Social login providers (Google, GitHub)
- [ ] API key management
- [ ] Webhook system
- [ ] Advanced analytics

---

## Support & Documentation

See **LMS_IMPLEMENTATION.md** for:
- Complete architecture overview
- Database schema details
- All Convex queries and mutations
- Security implementation details
- Deployment checklist

---

**Happy Testing! 🚀**
