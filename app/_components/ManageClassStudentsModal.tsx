// app/_components/ManageClassStudentsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X, 
  Users, 
  Search, 
  UserPlus, 
  UserMinus,
  Loader2,
  AlertCircle,
  GraduationCap
} from "lucide-react";

interface ManageClassStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string | null;
}

export function ManageClassStudentsModal({ isOpen, onClose, classId }: ManageClassStudentsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ جلب بيانات الفصل بالكامل (بما فيها الطلاب كـ objects)
  const classData = useQuery(api.classes.classes.getClassById, 
    classId ? { classId: classId as any } : "skip"
  );
  
  const availableStudents = useQuery(api.classes.classes.getAvailableStudents, 
    classId ? { classId: classId as any } : "skip"
  );


  const addStudent = useMutation(api.classes.classes.addStudentToClass);
  const removeStudent = useMutation(api.classes.classes.removeStudentFromClass);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !classId) return null;

  // ✅ classData.students هي array من objects (بعد التعديل في getClassById)
  const enrolledStudents = classData?.students || [];
  
  // ✅ فلتر الطلاب المتاحين
  const available = (availableStudents || []).filter((student: any) => {
    const searchLower = searchQuery.toLowerCase();
    return student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.studentId?.toLowerCase().includes(searchLower);
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

  const capacityPercentage = classData ? (enrolledStudents.length / classData.maxStudents) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">إدارة طلاب الفصل</h2>
              <p className="text-[#a3ced6] text-sm mt-1">
                {classData?.classNameAr} - {classData?.classCode}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Sidebar - Stats */}
          <div className="w-64 bg-[#f7fafa] border-l border-[#c0c8c9] p-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-[#001f24]">الطلاب المسجلين</h3>
              <p className="text-2xl font-bold text-[#1a7a8a]">{enrolledStudents.length}</p>
              <p className="text-xs text-gray-500">من أصل {classData?.maxStudents}</p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-[#1a7a8a] h-2 rounded-full transition-all"
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>

            <div className="border-t border-[#c0c8c9] pt-3">
              <p className="text-xs text-gray-500 text-center">
                السعة: {enrolledStudents.length}/{classData?.maxStudents}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-[#c0c8c9]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mt-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Available Students List */}
            <div className="flex-1 overflow-auto p-4">
              <h3 className="text-sm font-semibold text-[#001f24] mb-3">الطلاب المتاحون للإضافة</h3>
              <div className="space-y-2">
                {available.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>لا يوجد طلاب متاحون للإضافة</p>
                  </div>
                ) : (
                  available.map((student: any) => (
                    <div key={student._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">
                            {student.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#001f24]">{student.name || "طالب"}</p>
                          <p className="text-xs text-gray-500">{student.email || "..."}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddStudent(student._id)}
                        disabled={addingId === student._id || enrolledStudents.length >= (classData?.maxStudents || 0)}
                        className="bg-[#1a7a8a] hover:bg-[#001f24] text-white"
                      >
                        {addingId === student._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#c0c8c9] p-4 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                إغلاق
              </Button>
            </div>
          </div>
        </div>

        {/* ✅ Enrolled Students Section - عرض الطلاب المسجلين بشكل صحيح */}
        {enrolledStudents.length > 0 && (
          <div className="border-t border-[#c0c8c9] p-4 bg-[#f7fafa]">
            <h3 className="text-sm font-semibold text-[#001f24] mb-3">الطلاب المسجلين حالياً</h3>
            <div className="flex flex-wrap gap-2">
              {enrolledStudents.map((student: any) => (
                <div key={student._id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#c0c8c9]">
                  <span className="text-sm text-[#001f24]">{student.name || "طالب"}</span>
                  <button
                    onClick={() => handleRemoveStudent(student._id, student.name || "طالب")}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    {removingId === student._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserMinus className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}