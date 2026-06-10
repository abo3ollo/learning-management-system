# Course Management System - Implementation Steps

## Getting Started

### Prerequisites
- Next.js 15 with App Router
- Convex backend
- Clerk authentication
- shadcn/ui components installed
- TypeScript enabled

---

## Step-by-Step Implementation Order

### Step 1: Database Schema ✅
**Status**: COMPLETE

**What was done**:
- Updated `convex/schema.ts` with:
  - `courses` table
  - `chapters` table
  - `lessons` table
  - `enrollments` table
  - `lessonProgress` table
  - All indexes for optimal queries

**Files**:
- `convex/schema.ts`

---

### Step 2: Backend Queries & Mutations ✅
**Status**: COMPLETE

**What was done**:
- Created `convex/courses.ts` with:
  - Course CRUD queries and mutations
  - Chapter management functions
  - Lesson management functions
  - Enrollment tracking
  - Progress tracking
  - Full RBAC implementation

**Key Functions**:
- `getTeacherCourses()` - Get teacher's courses
- `createCourse()` - Create new course
- `updateCourse()` - Update course details
- `deleteCourse()` - Delete with cascade
- `createChapter()` - Add chapter to course
- `createLesson()` - Add lesson to chapter
- `enrollStudent()` - Student enrollment
- `markLessonComplete()` - Track progress

**Files**:
- `convex/courses.ts`

---

### Step 3: Permission Utilities ✅
**Status**: COMPLETE

**What was done**:
- Created `lib/permissions.ts` with:
  - Role-based permission checks
  - Course edit permission logic
  - Chapter/lesson permission functions
  - Enrollment permission functions

**Key Functions**:
- `canCreateCourse(role)` - Check create permission
- `canEditCourse(context)` - Check edit permission
- `canViewCourseDetails()` - Check view permission
- `canEnrollStudent()` - Check enrollment permission

**Files**:
- `lib/permissions.ts`

---

### Step 4: UI Components ✅
**Status**: COMPLETE

**What was done**:
- Created reusable components in `app/components/courses/`
- Implemented shadcn/ui integration
- Added loading/error states

**Components Created**:

#### CourseCard.tsx
- `CourseCard` - Display course with actions
- `ChapterList` - List chapters with options
- `LessonList` - List lessons with order and duration
- Features: Edit, delete, add buttons with icons

#### CourseForm.tsx
- `CourseForm` - Create/edit course
- Validation with Zod
- Thumbnail upload with preview
- Form state management with React Hook Form

#### ChapterLessonForm.tsx
- `ChapterForm` - Create/edit chapters
- `LessonForm` - Create/edit lessons
- Video URL validation
- Duration input for lessons

**Files**:
- `app/components/courses/CourseCard.tsx`
- `app/components/courses/CourseForm.tsx`
- `app/components/courses/ChapterLessonForm.tsx`

---

### Step 5: Teacher Dashboard Pages ✅
**Status**: COMPLETE

#### Page 1: Course List
**Path**: `/dashboard/teacher/courses`
**File**: `app/dashboard/teacher/courses/page.tsx`

**Features**:
- List all teacher's courses
- Search courses
- Create new course button
- Edit/delete course cards
- Loading states
- Empty states

**Functionality**:
```typescript
// Load teacher's courses
useQuery(api.courses.getTeacherCourses, { teacherId })

// Delete course with confirmation
await deleteCourse({ courseId })
```

#### Page 2: Create Course
**Path**: `/dashboard/teacher/courses/new`
**File**: `app/dashboard/teacher/courses/new/page.tsx`

**Features**:
- CourseForm component
- Error handling
- Loading state
- Back button
- Auto-redirect on success

**Functionality**:
```typescript
const courseId = await createCourse({
  title,
  description,
  thumbnail: base64String
})
router.push(`/dashboard/teacher/courses/${courseId}`)
```

#### Page 3: Edit Course
**Path**: `/dashboard/teacher/courses/[courseId]`
**File**: `app/dashboard/teacher/courses/[courseId]/page.tsx`

**Features**:
- Tabs for Details, Chapters
- Update course info
- Manage chapters
- Manage lessons
- Dialogs for create operations
- Drag-drop ready

**Functionality**:
```typescript
// Load course with chapters and lessons
const course = useQuery(api.courses.getCourseById, { courseId })

// Create chapter
await createChapter({
  courseId,
  title,
  description
})

// Create lesson
await createLesson({
  chapterId,
  courseId,
  title,
  description,
  videoUrl,
  duration
})
```

---

### Step 6: Student Pages ✅
**Status**: COMPLETE

#### Page 1: Student Courses
**Path**: `/student/courses`
**File**: `app/student/courses/page.tsx`

**Features**:
- Enrolled courses section
- Explore available courses section
- Search functionality
- Enrollment buttons
- Loading states
- Empty states

**Functionality**:
```typescript
// Get enrolled courses
const enrolledCourses = useQuery(
  api.courses.getStudentCourses,
  { studentId }
)

// Get available courses
const availableCourses = useQuery(
  api.courses.getPublishedCourses,
  { limit: 20 }
)

// Enroll in course
await enrollStudent({
  courseId,
  studentId
})
```

---

### Step 7: Course Detail Page (TODO)
**Path**: `/courses/[courseId]`

**To implement**:
- View course overview
- List chapters and lessons
- Video player
- Mark lessons complete
- Progress tracking
- Comments (future)

**Skeleton Code**:
```typescript
export default function CourseDetailPage() {
  const courseId = useParams().courseId
  const course = useQuery(api.courses.getCourseById, { courseId })
  const studentId = currentUser._id
  const progress = useQuery(
    api.courses.getStudentProgress,
    { studentId, courseId }
  )
  
  return (
    <div>
      {/* Course header */}
      {/* Chapters list */}
      {/* Lessons in selected chapter */}
      {/* Video player */}
      {/* Progress bar */}
    </div>
  )
}
```

---

## Usage Examples

### Creating a Course (Teacher)
```typescript
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

function TeacherCreateCourse() {
  const createCourse = useMutation(api.courses.createCourse)
  
  const handleCreate = async (data) => {
    const courseId = await createCourse({
      title: "React Fundamentals",
      description: "Learn React from scratch...",
      thumbnail: base64ImageData
    })
    // Redirect to edit page
  }
  
  return <CourseForm onSubmit={handleCreate} />
}
```

### Editing Course with Chapters
```typescript
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

function CourseEditor({ courseId }) {
  const course = useQuery(api.courses.getCourseById, { courseId })
  const createChapter = useMutation(api.courses.createChapter)
  
  const handleAddChapter = async (title) => {
    await createChapter({
      courseId,
      title,
      description: ""
    })
    // Course refetches automatically
  }
  
  return (
    <div>
      <h1>{course.title}</h1>
      <ChapterList 
        chapters={course.chapters}
        onAddChapter={handleAddChapter}
      />
    </div>
  )
}
```

### Enrolling in a Course (Student)
```typescript
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

function EnrollButton({ courseId, studentId }) {
  const enrollStudent = useMutation(api.courses.enrollStudent)
  
  const handleEnroll = async () => {
    await enrollStudent({
      courseId,
      studentId
    })
    // Show success message
  }
  
  return <Button onClick={handleEnroll}>Enroll Now</Button>
}
```

### Tracking Progress
```typescript
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

function CourseProgress({ studentId, courseId }) {
  const progress = useQuery(
    api.courses.getStudentProgress,
    { studentId, courseId }
  )
  
  return (
    <div>
      <p>Completed: {progress.completedLessons}/{progress.totalLessons}</p>
      <ProgressBar value={progress.progressPercentage} />
    </div>
  )
}
```

---

## Folder Structure Reference

```
project-root/
├── app/
│   ├── components/
│   │   └── courses/                          # Course components
│   │       ├── CourseCard.tsx               # ✅ CourseCard, ChapterList, LessonList
│   │       ├── CourseForm.tsx               # ✅ Course form with thumbnail
│   │       └── ChapterLessonForm.tsx        # ✅ Chapter & lesson forms
│   │
│   ├── dashboard/
│   │   └── teacher/
│   │       └── courses/
│   │           ├── page.tsx                 # ✅ List teacher's courses
│   │           ├── new/
│   │           │   └── page.tsx             # ✅ Create new course
│   │           └── [courseId]/
│   │               └── page.tsx             # ✅ Edit course
│   │
│   ├── student/
│   │   └── courses/
│   │       └── page.tsx                     # ✅ Student browse/enrolled courses
│   │
│   ├── courses/
│   │   └── [courseId]/
│   │       └── page.tsx                     # 🔲 Course detail (TODO)
│   │
│   └── teacher/
│       └── page.tsx                         # Redirect to courses
│
├── lib/
│   └── permissions.ts                       # ✅ RBAC utilities
│
└── convex/
    ├── schema.ts                            # ✅ Updated schema
    └── courses.ts                           # ✅ All queries & mutations
```

---

## API Summary by Role

### Teacher Endpoints
```
GET  /api/courses/teacher        → getTeacherCourses
POST /api/courses                → createCourse
PUT  /api/courses/[id]           → updateCourse
DEL  /api/courses/[id]           → deleteCourse

POST /api/courses/[id]/chapters  → createChapter
PUT  /api/courses/[id]/chapters  → reorderChapters

POST /api/chapters/[id]/lessons  → createLesson
PUT  /api/chapters/[id]/lessons  → reorderLessons
```

### Student Endpoints
```
GET  /api/courses/student        → getStudentCourses
POST /api/courses/[id]/enroll    → enrollStudent
POST /api/lessons/[id]/complete  → markLessonComplete
GET  /api/courses/[id]/progress  → getStudentProgress
```

### Admin Endpoints
```
GET  /api/courses                → getAdminCourses
(All teacher endpoints)
```

---

## Testing Checklist

### Teacher Course Management
- [ ] Navigate to `/dashboard/teacher/courses`
- [ ] Click "New Course"
- [ ] Fill in course details
- [ ] Upload thumbnail
- [ ] Create course successfully
- [ ] Navigate to course edit page
- [ ] Add chapter
- [ ] Add lesson to chapter
- [ ] Update lesson details
- [ ] Delete lesson
- [ ] Delete chapter
- [ ] Update course info
- [ ] Delete entire course

### Student Course Access
- [ ] Navigate to `/student/courses`
- [ ] See enrolled courses
- [ ] Search available courses
- [ ] Click enroll button
- [ ] Verify course appears in enrolled section

### Permissions
- [ ] Teacher cannot edit other teacher's courses
- [ ] Student cannot create courses
- [ ] Parent can only view (when parent pages created)
- [ ] Admin can edit all courses

---

## Next Steps

### Phase 1 (Current): Core Course Management ✅
- [x] Database schema
- [x] Queries & mutations
- [x] Teacher course pages
- [x] Student course listing

### Phase 2: Course Viewing & Progress
- [ ] Course detail page
- [ ] Lesson viewer with video player
- [ ] Mark lesson complete
- [ ] Progress tracking UI
- [ ] Student dashboard

### Phase 3: Admin Features
- [ ] Admin course management
- [ ] User course assignments
- [ ] Analytics dashboard

### Phase 4: Advanced Features
- [ ] Assignments & grading
- [ ] Quizzes & assessments
- [ ] Discussion forums
- [ ] Certificates
- [ ] Live sessions

---

## Production Deployment

### Before Going Live

1. **Data Validation**
   ```bash
   # Verify all course data
   npx convex run getAdminCourses
   ```

2. **Performance Testing**
   - Load test with 1000+ courses
   - Measure query response times
   - Monitor Convex usage

3. **Security Audit**
   - Verify RBAC is enforced
   - Check mutation permissions
   - Validate data isolation

4. **Error Handling**
   - Test error states
   - Verify fallbacks
   - Check error messages

5. **Backup Strategy**
   ```bash
   # Export data before deployment
   npx convex export data.json
   ```

---

## Troubleshooting

### Common Errors

**Error: "Unauthorized: Cannot update this course"**
- Course doesn't exist
- User is not the teacher
- User is not admin
- Solution: Verify courseId and user role

**Error: "Course not found"**
- Course deleted
- Wrong courseId in URL
- Solution: Check URL and database

**Error: "Chapter order is wrong"**
- Order values not updated
- Solution: Use reorderChapters mutation

**Courses not appearing for students**
- Course not published (isPublished = false)
- Student not enrolled
- Solution: Publish course and enroll student

---

## Performance Tips

1. **Query Optimization**
   - Use indexed fields in filters
   - Paginate large lists
   - Use denormalized courseId in lessons

2. **Component Optimization**
   - Memoize list components
   - Use suspense for data loading
   - Implement virtual scrolling for large lists

3. **Database Optimization**
   - Monitor index usage
   - Archive old courses
   - Clean up orphaned data

---

**Status**: 🟢 Ready for Phase 2 Implementation!

See `COURSE_MANAGEMENT_GUIDE.md` for detailed API documentation.
