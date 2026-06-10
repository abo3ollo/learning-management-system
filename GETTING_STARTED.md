# 🚀 Course Management System - Getting Started

## First Time Setup

### Prerequisites
```bash
✅ Node.js installed
✅ npm or yarn installed
✅ Convex initialized (npx convex init)
✅ Clerk auth configured
✅ shadcn/ui components installed
```

### Verify Installation
```bash
# Check Next.js
npx next --version

# Check Convex
npx convex --version

# Check TypeScript
npx tsc --version
```

---

## Start Development (5 min)

### Terminal 1: Next.js Dev Server
```bash
cd e:\learning-management-system
npm run dev
```
**Access**: http://localhost:3000

### Terminal 2: Convex Dev Server
```bash
cd e:\learning-management-system
npx convex dev
```
**Auto-syncs** schema and functions

### Terminal 3: Optional - Watch TypeScript
```bash
npx tsc --watch --noEmit
```
**Shows** any type errors

---

## Test The System (10 min)

### Step 1: Login as Teacher
```
1. Go to http://localhost:3000
2. Sign up / Sign in
3. Clerk will assign your role based on setup
4. If not teacher, update role in Convex dashboard
```

### Step 2: Create Your First Course
```
Route: http://localhost:3000/dashboard/teacher/courses

Actions:
1. Click "New Course" button
2. Fill in:
   - Title: "React Basics"
   - Description: "Learn React fundamentals"
   - Thumbnail: Upload any image (optional)
3. Click "Create Course"
4. Auto-redirects to edit page
```

### Step 3: Add Chapter & Lessons
```
On course edit page:

1. Click "Add Chapter"
   - Title: "Getting Started"
   - Description: (optional)
   - Save

2. Select chapter
3. Click "Add Lesson"
   - Title: "Introduction"
   - Description: "What is React?"
   - Video URL: (optional - any YouTube URL)
   - Duration: 300 (5 minutes in seconds)
   - Save
```

### Step 4: Publish Course
```
1. Go to "Details" tab
2. Check "Published" checkbox
3. Click "Update Course"
4. Course is now visible to students!
```

### Step 5: Test as Student
```
1. Sign out (top right)
2. Sign in as different user (or same)
3. Go to http://localhost:3000/student/courses
4. See your published course
5. Click "Enroll Now"
6. Course appears in "Your Courses"
```

---

## File Locations Quick Reference

```
📂 Backend
  convex/courses.ts              ← All Convex functions
  convex/schema.ts               ← Database schema
  lib/permissions.ts             ← RBAC helpers

📂 Components  
  app/components/courses/        ← 3 reusable components

📂 Teacher Pages
  app/dashboard/teacher/courses/
    ├── page.tsx                 ← List courses
    ├── new/page.tsx             ← Create course
    └── [courseId]/page.tsx      ← Edit course

📂 Student Pages
  app/student/courses/page.tsx   ← Browse & enroll

📚 Documentation
  COURSE_IMPLEMENTATION_SUMMARY.md  ← Overview
  COURSE_MANAGEMENT_GUIDE.md        ← Complete reference
  COURSE_MANAGEMENT_STEPS.md        ← Step-by-step
  COURSE_QUICK_REFERENCE.md         ← Quick lookup
```

---

## Common Commands

### Development
```bash
# Start Next.js
npm run dev

# Start Convex
npx convex dev

# Build Next.js
npm run build

# Check types
npx tsc --noEmit
```

### Convex Management
```bash
# Deploy to production
npx convex deploy

# View Convex logs
npx convex logs

# Query database
npx convex run getAdminCourses

# Reset local data
rm -rf .convex
npx convex dev
```

### Database
```bash
# List all courses
npx convex run getAdminCourses

# Search courses
npx convex run 'searchCourses --query "React"'

# Delete all data (caution!)
npx convex run 'truncateAllTables'
```

---

## Keyboard Shortcuts

### In Next.js Browser
```
Ctrl+K          → Open search/command palette
Ctrl+Shift+F    → Search across project
Ctrl+/          → Toggle comment
Ctrl+Shift+P    → VS Code command palette
```

### In VS Code
```
Cmd+P (Mac) / Ctrl+P (Win)     → Open file quick
Cmd+Shift+F / Ctrl+Shift+F     → Find in files
F5                             → Start debugging
Ctrl+Backtick                  → Toggle terminal
```

---

## URL Routes Reference

### Teacher Routes
```
http://localhost:3000/dashboard/teacher/courses
  → List all courses

http://localhost:3000/dashboard/teacher/courses/new
  → Create new course

http://localhost:3000/dashboard/teacher/courses/abc123def456
  → Edit specific course
```

### Student Routes
```
http://localhost:3000/student/courses
  → Browse and enroll
```

### Redirect
```
http://localhost:3000/dashboard/teacher
  → Auto-redirects to /courses
```

---

## Testing Checklist

### Teacher Workflow
- [ ] Navigate to `/dashboard/teacher/courses`
- [ ] See "New Course" button
- [ ] Click and fill out course form
- [ ] Upload thumbnail image
- [ ] Course created and redirect works
- [ ] Click edit on course card
- [ ] See "Details" and "Chapters" tabs
- [ ] Click "Add Chapter"
- [ ] Add chapter successfully
- [ ] Select chapter to show lessons
- [ ] Click "Add Lesson"
- [ ] Add lesson with video URL
- [ ] Update lesson details
- [ ] Delete lesson
- [ ] Delete chapter
- [ ] Update course details
- [ ] Publish course
- [ ] Delete entire course

### Student Workflow
- [ ] Navigate to `/student/courses`
- [ ] See "Your Courses" section (empty)
- [ ] See "Explore Courses" section
- [ ] Search for course
- [ ] Click "Enroll Now"
- [ ] See enrolled count update
- [ ] Course moves to "Your Courses"
- [ ] Click on enrolled course
- [ ] See course details (coming in Phase 2)

### Admin Workflow
- [ ] Have admin role
- [ ] Can create courses
- [ ] Can edit any course (not just own)
- [ ] Can delete any course
- [ ] Can see all courses

---

## Troubleshooting

### Issue: Course doesn't appear for students
```
Check:
1. Is course published? (Check "Published" in details)
2. Is student logged in?
3. Is student different user from teacher?

Fix:
1. Go back to teacher dashboard
2. Click course
3. Go to "Details" tab
4. Check "Published"
5. Save
6. Switch to student and refresh
```

### Issue: "Unauthorized" error
```
Check:
1. Are you the course teacher?
2. Do you have admin role?
3. Is the course owned by someone else?

Fix:
1. Switch to original user
2. Make edits as owner
3. OR switch to admin user to edit any course
```

### Issue: Image upload fails
```
Check:
1. Is image size reasonable? (< 5MB)
2. Is format PNG/JPG/GIF?
3. Is there disk space?

Fix:
1. Compress image
2. Try different format
3. Restart Convex dev server
```

### Issue: Convex not syncing
```
Check:
1. Is convex dev running in terminal 2?
2. Are there TypeScript errors?
3. Is schema.ts valid?

Fix:
1. Kill Convex terminal
2. Run: npx convex dev
3. Check terminal for errors
4. Refresh browser
```

### Issue: Can't find course after creating
```
Check:
1. Wait a moment (sync delay)
2. Refresh page
3. Check console for errors

Fix:
1. Hard refresh: Ctrl+Shift+R
2. Check browser console (F12)
3. Check Convex logs: npx convex logs
```

---

## Performance Tips

### For Better Speed
```bash
# 1. Clear browser cache
Ctrl+Shift+Delete → Clear browsing data

# 2. Rebuild Convex
npx convex dev --clean

# 3. Close unused terminals

# 4. Use smaller thumbnail images

# 5. Close other browser tabs
```

### Monitor Performance
```bash
# Check query response time
npx convex logs

# Monitor Convex usage
# → Dashboard at convex.cloud
```

---

## Debug Mode

### Enable Detailed Logs
```typescript
// In app/page.tsx or any component
useEffect(() => {
  console.log("Component mounted")
  return () => console.log("Component unmounted")
}, [])
```

### Browser DevTools
```
F12 → Opens developer tools

Tabs:
- Console: See logs and errors
- Network: See API calls
- Application: See stored data
- Performance: Monitor speed
```

### Convex Logs
```bash
npx convex logs --follow
# Shows all mutations and queries in real-time
```

---

## Reset Everything

### If Something Breaks
```bash
# 1. Stop all terminals (Ctrl+C)

# 2. Clear Convex data
rm -rf .convex

# 3. Restart servers
npm run dev          # Terminal 1
npx convex dev       # Terminal 2

# 4. Refresh browser
Ctrl+Shift+R
```

### Clear Browser Data
```
Chrome/Edge:
1. Ctrl+Shift+Delete
2. Select "All time"
3. Check "Cookies and site data"
4. Click "Clear"

Firefox:
1. Ctrl+Shift+Delete
2. Click "Clear Now"
```

---

## Next Steps

### After Getting Comfortable
1. ✅ Test all teacher features
2. ✅ Test all student features
3. ✅ Check RBAC enforcement
4. ✅ Try admin features
5. 🔲 Read `COURSE_MANAGEMENT_GUIDE.md`
6. 🔲 Plan Phase 2 features
7. 🔲 Implement course viewer page
8. 🔲 Add video player
9. 🔲 Deploy to production

---

## Support Resources

### Documentation
- `COURSE_QUICK_REFERENCE.md` → Quick lookup
- `COURSE_MANAGEMENT_GUIDE.md` → Full reference
- `COURSE_MANAGEMENT_STEPS.md` → Implementation details

### External Links
- [Convex Docs](https://docs.convex.dev)
- [Next.js Docs](https://nextjs.org/docs)
- [Clerk Docs](https://clerk.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### Common Questions
**Q: Where are the database files?**
A: Local Convex DB is in `.convex/` folder

**Q: How do I see database contents?**
A: Use `npx convex run getAdminCourses`

**Q: Can I have multiple teachers?**
A: Yes! Each user with "teacher" role has their own courses

**Q: Can teachers see each other's courses?**
A: No, only their own (unless admin)

**Q: Where's the admin dashboard?**
A: Coming in Phase 2!

---

## Success Indicators

You'll know it's working when:
- ✅ Course list page loads
- ✅ Can create a course
- ✅ Course appears in list
- ✅ Can edit course details
- ✅ Can add chapters
- ✅ Can add lessons
- ✅ Can publish course
- ✅ Course appears for students
- ✅ Can enroll as student
- ✅ No TypeScript errors

---

**Ready? Start with:**
```bash
npm run dev
# Then visit http://localhost:3000
```

**Questions?** Check `COURSE_QUICK_REFERENCE.md` 📖

Good luck! 🚀
