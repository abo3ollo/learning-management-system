// app/_components/ClassTeachersTab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  School,
  Search,
  UserPlus,
  UserMinus,
  Loader2,
  AlertCircle,
  GraduationCap,
  Mail,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClassTeachersTabProps {
  classId: string;
}

export function ClassTeachersTab({ classId }: ClassTeachersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const classData = useQuery(api.classes.classes.getClassById, {
    classId: classId as any,
  });

  const availableTeachers = useQuery(api.classes.classes.getAvailableTeachers, {
    classId: classId as any,
  });

  const addTeacher = useMutation(api.classes.classes.addTeacherToClass);
  const removeTeacher = useMutation(api.classes.classes.removeTeacherFromClass);

  const enrolledTeachers = classData?.teachers || [];
  const isLoading = classData === undefined;

  const available = (availableTeachers || []).filter((teacher: any) =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTeacher = async (teacherId: string) => {
    setAddingId(teacherId);
    setError(null);
    try {
      await addTeacher({ classId: classId as any, teacherId: teacherId as any });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveTeacher = async (teacherId: string, teacherName: string) => {
    if (!confirm(`هل أنت متأكد من إزالة المعلم "${teacherName}" من هذا الفصل؟`)) return;

    setRemovingId(teacherId);
    setError(null);
    try {
      await removeTeacher({ classId: classId as any, teacherId: teacherId as any });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#001f24]">معلمو الفصل</h3>
          <p className="text-sm text-gray-500 mt-1">
            إدارة المعلمين المسجلين في هذا الفصل
          </p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-[#001f24]">{enrolledTeachers.length}</span> معلم
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Teachers */}
        <div>
          <h4 className="text-sm font-semibold text-[#001f24] mb-3 flex items-center gap-2">
            <School className="h-4 w-4 text-[#1a7a8a]" />
            المعلمين المسجلين ({enrolledTeachers.length})
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#1a7a8a]" />
            </div>
          ) : enrolledTeachers.length === 0 ? (
            <div className="text-center py-8 bg-[#f7fafa] rounded-xl border border-dashed border-[#c0c8c9]">
              <School className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">لا يوجد معلمين مسجلين</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-100 overflow-y-auto">
              {enrolledTeachers.map((teacher: any) => (
                <div
                  key={teacher._id}
                  className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg hover:bg-[#e0f5f7] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">
                        {teacher.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#001f24] text-sm">{teacher.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        {teacher.email}
                        {teacher.specialization && (
                          <>
                            <span className="text-gray-300">|</span>
                            <Briefcase className="h-3 w-3" />
                            {teacher.specialization}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTeacher(teacher._id, teacher.name)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={removingId === teacher._id}
                  >
                    {removingId === teacher._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserMinus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Teachers */}
        <div>
          <h4 className="text-sm font-semibold text-[#001f24] mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#1a7a8a]" />
            المعلمين المتاحون للإضافة
          </h4>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث عن معلم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {available.length === 0 ? (
            <div className="text-center py-8 bg-[#f7fafa] rounded-xl border border-dashed border-[#c0c8c9]">
              <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">
                {searchQuery ? "لا توجد نتائج" : "لا يوجد معلمين متاحين للإضافة"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-100 overflow-y-auto">
              {available.map((teacher: any) => (
                <div
                  key={teacher._id}
                  className="flex items-center justify-between p-3 bg-white border border-[#c0c8c9] rounded-lg hover:border-[#1a7a8a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">
                        {teacher.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#001f24] text-sm">{teacher.name}</p>
                      <p className="text-xs text-gray-500">
                        {teacher.specialization || teacher.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddTeacher(teacher._id)}
                    disabled={addingId === teacher._id}
                    className="bg-[#1a7a8a] hover:bg-[#001f24] text-white"
                  >
                    {addingId === teacher._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}