// app/_components/ClassStudentsTab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  Search,
  UserPlus,
  UserMinus,
  Loader2,
  AlertCircle,
  GraduationCap,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClassStudentsTabProps {
  classId: string;
}

export function ClassStudentsTab({ classId }: ClassStudentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const classData = useQuery(api.classes.classes.getClassById, {
    classId: classId as any,
  });

  const availableStudents = useQuery(api.classes.classes.getAvailableStudents, {
    classId: classId as any,
  });

  const addStudent = useMutation(api.classes.classes.addStudentToClass);
  const removeStudent = useMutation(api.classes.classes.removeStudentFromClass);

  const enrolledStudents = classData?.students || [];
  const isLoading = classData === undefined;

  const available = (availableStudents || []).filter((student: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.studentId?.toLowerCase().includes(searchLower)
    );
  });

  const handleAddStudent = async (studentId: string) => {
    setAddingId(studentId);
    setError(null);
    try {
      await addStudent({ classId: classId as any, studentId: studentId as any });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`هل أنت متأكد من إزالة الطالب "${studentName}" من هذا الفصل؟`)) return;

    setRemovingId(studentId);
    setError(null);
    try {
      await removeStudent({ classId: classId as any, studentId: studentId as any });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setRemovingId(null);
    }
  };

  const capacityPercentage = classData
    ? (enrolledStudents.length / classData.maxStudents) * 100
    : 0;

  return (
    <div className="p-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#001f24]">طلاب الفصل</h3>
          <p className="text-sm text-gray-500 mt-1">
            إدارة الطلاب المسجلين في هذا الفصل
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-[#001f24]">{enrolledStudents.length}</span> من{" "}
            <span className="font-semibold text-[#001f24]">{classData?.maxStudents || 0}</span> طالب
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#1a7a8a] h-2 rounded-full transition-all"
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
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
        {/* Enrolled Students */}
        <div>
          <h4 className="text-sm font-semibold text-[#001f24] mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#1a7a8a]" />
            الطلاب المسجلين ({enrolledStudents.length})
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#1a7a8a]" />
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="text-center py-8 bg-[#f7fafa] rounded-xl border border-dashed border-[#c0c8c9]">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">لا يوجد طلاب مسجلين</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-100 overflow-y-auto">
              {enrolledStudents.map((student: any) => (
                <div
                  key={student._id}
                  className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg hover:bg-[#e0f5f7] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        {student.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#001f24] text-sm">{student.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        {student.email}
                        {student.phoneNumber && (
                          <>
                            <span className="text-gray-300">|</span>
                            <Phone className="h-3 w-3" />
                            {student.phoneNumber}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStudent(student._id, student.name)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={removingId === student._id}
                  >
                    {removingId === student._id ? (
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

        {/* Available Students */}
        <div>
          <h4 className="text-sm font-semibold text-[#001f24] mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#1a7a8a]" />
            الطلاب المتاحون للإضافة
          </h4>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث عن طالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {available.length === 0 ? (
            <div className="text-center py-8 bg-[#f7fafa] rounded-xl border border-dashed border-[#c0c8c9]">
              <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">
                {searchQuery ? "لا توجد نتائج" : "لا يوجد طلاب متاحون للإضافة"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-100 overflow-y-auto">
              {available.map((student: any) => (
                <div
                  key={student._id}
                  className="flex items-center justify-between p-3 bg-white border border-[#c0c8c9] rounded-lg hover:border-[#1a7a8a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        {student.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#001f24] text-sm">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddStudent(student._id)}
                    disabled={
                      addingId === student._id ||
                      enrolledStudents.length >= (classData?.maxStudents || 0)
                    }
                    className="bg-[#1a7a8a] hover:bg-[#001f24] text-white"
                  >
                    {addingId === student._id ? (
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