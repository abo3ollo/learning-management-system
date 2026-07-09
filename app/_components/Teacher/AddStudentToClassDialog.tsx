// app/_components/Teacher/AddStudentToClassDialog.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  Loader2,
  UserPlus,
  CheckCircle,
  X,
} from "lucide-react";
import { Label } from "@/components/ui/label";

interface AddStudentToClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  classGrade?: string;
  onSuccess?: () => void;
}

export function AddStudentToClassDialog({
  isOpen,
  onClose,
  classId,
  classGrade,
  onSuccess,
}: AddStudentToClassDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  // ✅ جلب الطلاب المتاحين للإضافة (من نفس الصف)
  const availableStudents = useQuery(
    api.classes.classes.getAvailableStudents,
    isOpen && classId ? { classId: classId as any } : "skip"
  );

  const addStudent = useMutation(api.classes.classes.addStudentToClass);

  // ✅ فلترة الطلاب حسب البحث
  const filteredStudents = availableStudents?.filter((student: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(search) ||
      student.studentId?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search)
    );
  }) || [];

  // ✅ إضافة طالب
  const handleAddStudent = async () => {
    if (!selectedStudentId) return;

    setIsAdding(true);
    try {
      await addStudent({
        classId: classId as any,
        studentId: selectedStudentId as any,
      });
      setSelectedStudentId("");
      setSearchQuery("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding student:", error);
      alert(error.message || "حدث خطأ أثناء إضافة الطالب");
    } finally {
      setIsAdding(false);
    }
  };

  // ✅ إعادة تعيين عند الإغلاق
  const handleClose = () => {
    setSelectedStudentId("");
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#001f24]">
            <UserPlus className="h-6 w-6 inline ml-2" />
            إضافة طالب
          </DialogTitle>
          <p className="text-sm text-gray-500">
            اختر طالباً من قائمة الطلاب المتاحين للإضافة
            {classGrade && (
              <span className="text-[#1a7a8a] font-medium mr-1">
                (الصف: {classGrade})
              </span>
            )}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4 py-4">
          {/* بحث */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث عن طالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* عدد النتائج */}
          <div className="text-sm text-gray-500">
            {filteredStudents.length} طالب متاح
          </div>

          {/* قائمة الطلاب المتاحين */}
          <div className="flex-1 overflow-y-auto space-y-2 border border-[#c0c8c9] rounded-lg p-2">
            {availableStudents === undefined ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">
                  {searchQuery
                    ? "لا توجد نتائج تطابق بحثك"
                    : "لا يوجد طلاب متاحون للإضافة"}
                </p>
                <p className="text-sm text-gray-400">
                  {searchQuery
                    ? "جرب كلمات بحث مختلفة"
                    : "جميع الطلاب مسجلون في هذه المجموعة"}
                </p>
              </div>
            ) : (
              filteredStudents.map((student: any) => {
                const isSelected = selectedStudentId === student._id;
                return (
                  <label
                    key={student._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-[#1a7a8a] bg-[#e0f5f7]"
                        : "border-[#c0c8c9] hover:border-[#1a7a8a]"
                    }`}
                    onClick={() => setSelectedStudentId(student._id)}
                  >
                    <input
                      type="radio"
                      name="student"
                      value={student._id}
                      checked={isSelected}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-4 h-4 text-[#1a7a8a] accent-[#1a7a8a]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#001f24] truncate">
                          {student.name}
                        </p>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>{student.studentId || "STU-000"}</span>
                        <span className="text-gray-300">•</span>
                        <span className="truncate">{student.email}</span>
                        {student.grade && (
                          <>
                            <span className="text-gray-300">•</span>
                            <Badge variant="outline" className="text-[#1a7a8a] border-[#1a7a8a] text-xs">
                              {student.grade}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        student.status === "active"
                          ? "border-green-500 text-green-600 shrink-0"
                          : "border-gray-300 text-gray-500 shrink-0"
                      }
                    >
                      {student.status === "active" ? "نشط" : "غير نشط"}
                    </Badge>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isAdding}>
            إلغاء
          </Button>
          <Button
            onClick={handleAddStudent}
            disabled={!selectedStudentId || isAdding}
            className="bg-[#001f24] hover:bg-[#03363d] text-white min-w-32"
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري الإضافة...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 ml-2" />
                إضافة الطالب
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}