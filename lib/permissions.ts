import { Id } from "@/convex/_generated/dataModel";

export type Role = "student" | "teacher" | "parent" | "admin";

export interface UserContext {
  id: Id<"users">;
  role: Role;
  name: string;
  email: string;
}

export interface PermissionContext {
  user: UserContext;
  courseTeacherId?: Id<"users">;
}

// Course Permissions
export const canCreateCourse = (role: Role): boolean => {
  return role === "teacher" || role === "admin";
};

export const canEditCourse = (context: PermissionContext): boolean => {
  const { user, courseTeacherId } = context;
  return user.role === "admin" || user.id === courseTeacherId;
};

export const canDeleteCourse = (context: PermissionContext): boolean => {
  return canEditCourse(context);
};

export const canPublishCourse = (context: PermissionContext): boolean => {
  return canEditCourse(context);
};

// Chapter Permissions
export const canCreateChapter = (context: PermissionContext): boolean => {
  return canEditCourse(context);
};

export const canEditChapter = (context: PermissionContext): boolean => {
  return canEditCourse(context);
};

export const canDeleteChapter = (context: PermissionContext): boolean => {
  return canEditCourse(context);
};

// Lesson Permissions
export const canCreateLesson = (context: PermissionContext): boolean => {
  return canEditCourse(context);
};

export const canEditLesson = (context: PermissionContext): boolean => {
  return canEditCourse(context);
};

export const canDeleteLesson = (context: PermissionContext): boolean => {
  return canEditCourse(context);
};

// View Permissions
export const canViewCourseDetails = (context: PermissionContext, isPublished: boolean): boolean => {
  const { user, courseTeacherId } = context;
  
  // Teacher can view their own unpublished courses
  if (user.id === courseTeacherId) return true;
  
  // Admin can view all courses
  if (user.role === "admin") return true;
  
  // Students/Parents can only view published courses
  if (user.role === "student" || user.role === "parent") {
    return isPublished;
  }
  
  return false;
};

// Enrollment Permissions
export const canEnrollStudent = (context: PermissionContext): boolean => {
  return context.user.role === "student" || context.user.role === "admin";
};
