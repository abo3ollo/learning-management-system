# Course Management System - Quick Reference

## 🚀 Quick Start

### 1. Start Development
```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Convex
npx convex dev
```

### 2. First Time Setup
- Go to `http://localhost:3000`
- Sign in as a teacher
- Navigate to `/dashboard/teacher/courses`
- Click "New Course" button

### 3. Create a Course
```
Title: React Fundamentals
Description: Learn React from basics to advanced concepts
Upload Thumbnail: (select an image)
→ Click "Create Course"
→ Auto-redirects to edit page
```

### 4. Add Chapters & Lessons
```
On course edit page:
- Click "Add Chapter" button
- Enter chapter title & description
- Select chapter
- Click "Add Lesson" button
- Fill in lesson details (video URL, duration, etc.)
```

### 5. Publish Course
```
In course details tab:
- Click "Update Course"
- Check "Published" checkbox
- Save
→ Course now visible to students
```

---

## 📁 File Reference

### Key Files Created

**Backend** (Convex)
- `convex/schema.ts` - Course, Chapter, Lesson tables
- `convex/courses.ts` - All queries & mutations

**Components**
- `app/components/courses/CourseCard.tsx`
- `app/components/courses/CourseForm.tsx`
- `app/components/courses/ChapterLessonForm.tsx`

**Teacher Pages**
- `app/dashboard/teacher/courses/page.tsx` - List courses
- `app/dashboard/teacher/courses/new/page.tsx` - Create course
- `app/dashboard/teacher/courses/[courseId]/page.tsx` - Edit course

**Student Pages**
- `app/student/courses/page.tsx` - Browse & enroll

**Utilities**
- `lib/permissions.ts` - RBAC helpers

---

## 🔐 RBAC Permissions

### Teacher Can:
✅ Create courses
✅ Edit own courses
✅ Delete own courses
✅ Manage chapters & lessons
✅ Publish/unpublish courses

### Student Can:
✅ View published courses
✅ Enroll in courses
✅ View enrolled courses
✅ Track progress
✅ Mark lessons complete

### Admin Can:
✅ Do everything teacher can do
✅ Edit any course
✅ View all courses
✅ Manage any chapter/lesson

### Parent Can:
✅ View student courses (when implemented)
✅ Track student progress (when implemented)

---

## 📊 Database Schema Summary

```
Courses
├── teacherId (FK to users)
├── title, description, thumbnail
├── isPublished (boolean)
└── timestamps

Chapters
├── courseId (FK to courses)
├── title, description
├── order (for sorting)
└── timestamps

Lessons
├── chapterId (FK to chapters)
├── courseId (denormalized)
├── title, description
├── videoUrl, duration
├── order (for sorting)
└── timestamps

Enrollments
├── courseId, studentId
└── progress, timestamps

LessonProgress
├── lessonId, studentId, courseId
├── isCompleted, completedAt
```

---

## 🔗 API Endpoints

### Courses
```
getTeacherCourses(teacherId) → Course[]
getAdminCourses() → Course[]
getCourseById(courseId) → Course with chapters & lessons
getStudentCourses(studentId) → enrolled Course[]
searchCourses(query) → Course[]
getPublishedCourses() → Course[]

createCourse({title, description, thumbnail}) → courseId
updateCourse({courseId, title, description, thumbnail, isPublished})
deleteCourse({courseId}) → cascade delete
```

### Chapters
```
getChapters(courseId) → Chapter[]
createChapter({courseId, title, description}) → chapterId
updateChapter({chapterId, title, description, isPublished})
deleteChapter({chapterId}) → cascade delete
reorderChapters({courseId, chapters: [id, id, id...]})
```

### Lessons
```
getLessons(chapterId) → Lesson[]
getLesson(lessonId) → Lesson
createLesson({chapterId, courseId, title, description, videoUrl, duration}) → lessonId
updateLesson({lessonId, title, description, videoUrl, duration, isPublished})
deleteLesson({lessonId})
reorderLessons({chapterId, lessons: [id, id, id...]})
```

### Enrollment & Progress
```
enrollStudent({courseId, studentId}) → enrollmentId
markLessonComplete({lessonId, courseId}) → progressId
getStudentProgress({studentId, courseId}) → {totalLessons, completedLessons, progressPercentage}
```

---

## 🛠️ Common Tasks

### Create a Course (Code Example)
```typescript
const createCourse = useMutation(api.courses.createCourse)

const courseId = await createCourse({
  title: "Advanced TypeScript",
  description: "Master TypeScript for production apps",
  thumbnail: base64ImageString
})
```

### Add Chapter
```typescript
const createChapter = useMutation(api.courses.createChapter)

await createChapter({
  courseId,
  title: "Generics",
  description: "Understanding TypeScript generics"
})
```

### Add Lesson
```typescript
const createLesson = useMutation(api.courses.createLesson)

await createLesson({
  chapterId,
  courseId,
  title: "Generic Functions",
  videoUrl: "https://youtube.com/...",
  duration: 600
})
```

### Enroll Student
```typescript
const enrollStudent = useMutation(api.courses.enrollStudent)

await enrollStudent({
  courseId,
  studentId: currentUser._id
})
```

### Track Progress
```typescript
const progress = useQuery(
  api.courses.getStudentProgress,
  { studentId, courseId }
)

console.log(`${progress.progressPercentage}% complete`)
```

---

## 🚨 Error Handling

### Permission Denied
```
Error: "Unauthorized: Cannot update this course"
→ Check if user is teacher or admin
→ Verify courseId is correct
```

### Not Found
```
Error: "Course not found"
→ Check if course exists in database
→ Verify courseId in URL/params
```

### Validation Errors
```
Error: "Title must be at least 3 characters"
→ Check form validation (Zod schemas)
→ Review constraints in COURSE_MANAGEMENT_GUIDE.md
```

---

## 📋 Routes Reference

### Teacher Routes
```
/dashboard/teacher/courses
  ├── GET - List all teacher's courses
  
/dashboard/teacher/courses/new
  ├── GET - Create course form
  
/dashboard/teacher/courses/[courseId]
  ├── GET - Edit course, manage chapters/lessons
```

### Student Routes
```
/student/courses
  ├── GET - Browse published & view enrolled courses

/courses/[courseId] (TODO)
  ├── GET - View course details & lessons
```

### Admin Routes (TODO)
```
/admin/courses
  ├── GET - List all courses
  ├── POST - Create course

/admin/courses/[courseId]
  ├── GET/PUT/DELETE - Manage any course
```

---

## ✅ Implementation Status

### Completed
- [x] Database schema with all tables
- [x] All Convex queries & mutations
- [x] RBAC permission system
- [x] Course form component
- [x] Chapter & lesson forms
- [x] Course card components
- [x] Teacher course list page
- [x] Create course page
- [x] Edit course page with chapter/lesson management
- [x] Student course list & browse page
- [x] Permission utilities

### In Progress
- [ ] Course detail page
- [ ] Lesson viewer component
- [ ] Video player integration
- [ ] Admin course management pages
- [ ] Analytics dashboard

### Planned
- [ ] Drag-drop chapter/lesson reordering
- [ ] Assignment system
- [ ] Quiz functionality
- [ ] Discussion forums
- [ ] Certificate generation
- [ ] Email notifications
- [ ] Advanced analytics

---

## 📞 Support

### Documentation
- `COURSE_MANAGEMENT_GUIDE.md` - Full API documentation
- `COURSE_MANAGEMENT_STEPS.md` - Step-by-step implementation guide
- Code comments in all files

### Debug
```bash
# Check Convex data
npx convex run getAdminCourses

# View Convex logs
npx convex logs

# Clear local data
rm -rf .convex
npx convex dev
```

### Common Questions

**Q: How do I publish a course?**
A: In the course edit page, go to "Details" tab, check the published checkbox, and save.

**Q: Can students reorder lessons?**
A: No, only teachers can reorder (with reorderLessons mutation).

**Q: How is progress calculated?**
A: Progress % = (completed lessons / total lessons) * 100

**Q: Can a student be in multiple courses?**
A: Yes, each enrollment is independent.

**Q: What happens when I delete a course?**
A: All chapters, lessons, enrollments, and progress are deleted.

---

## 🎯 Next Steps

1. **Test the System**
   - Create a course as teacher
   - Add chapters and lessons
   - Publish course
   - Enroll as student
   - Track progress

2. **Implement Phase 2**
   - Create course detail page (`/courses/[courseId]`)
   - Build lesson viewer component
   - Add video player integration
   - Implement completion tracking

3. **Optimize & Deploy**
   - Run performance tests
   - Verify RBAC enforcement
   - Deploy to production
   - Monitor analytics

---

**Ready to build? Start with `/dashboard/teacher/courses` 🚀**
