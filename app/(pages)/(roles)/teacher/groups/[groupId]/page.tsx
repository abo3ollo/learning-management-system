// app/(pages)/(roles)/teacher/groups/[groupId]/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Users,
  UserPlus,
  Loader2,
  UserMinus,
  Search,
  Calendar,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeacherGroupDetailsPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // جلب بيانات المجموعة
  const group = useQuery(
    api.groups.groups.getGroupById,
    groupId ? { groupId: groupId as any } : "skip"
  );

  // جلب الطلاب المتاحين
  const availableStudents = useQuery(
    api.groups.groups.getAvailableStudentsForGroup,
    groupId ? { groupId: groupId as any, search: searchQuery || undefined } : "skip"
  );

  const removeStudent = useMutation(api.groups.groups.removeStudentFromGroup);
  const addStudent = useMutation(api.groups.groups.addStudentToGroup);

  if (group === undefined || availableStudents === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">المجموعة غير موجودة</h2>
          <Link href="/teacher/groups">
            <Button className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للمجموعات
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("هل أنت متأكد من إزالة هذا الطالب من المجموعة؟")) return;
    setIsRemoving(studentId);
    try {
      await removeStudent({
        groupId: groupId as any,
        studentId: studentId as any,
      });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء إزالة الطالب");
    } finally {
      setIsRemoving(null);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId) return;
    setIsAdding(true);
    try {
      await addStudent({
        groupId: groupId as any,
        studentId: selectedStudentId as any,
      });
      setSelectedStudentId("");
      setIsAddStudentOpen(false);
      alert("✅ تم إضافة الطالب بنجاح");
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء إضافة الطالب");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/teacher/groups">
            <Button variant="ghost" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              العودة للمجموعات
            </Button>
          </Link>
          <Link href={`/teacher/groups/${groupId}/schedule`}>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              الجدول
            </Button>
          </Link>
        </div>
        <Button
          onClick={() => setIsAddStudentOpen(true)}
          className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
        >
          <UserPlus className="h-4 w-4" />
          إضافة طالب
        </Button>
      </div>

      {/* Group Info */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">
          {group.name}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <Badge className="bg-[#1a7a8a] text-white">{group.subject}</Badge>
          <Badge className="bg-green-100 text-green-700">نشط</Badge>
          <span className="text-sm text-gray-500">
            الصف: {group.gradeName}
          </span>
          <span className="text-sm text-gray-500">
            {group.students.length} / {group.maxStudents} طالب
          </span>
        </div>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1a7a8a]" />
            الطلاب المسجلون ({group.students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {group.students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">لا يوجد طلاب مسجلين</p>
            </div>
          ) : (
            <div className="space-y-2">
              {group.students.map((student: any) => (
                <div
                  key={student._id}
                  className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg border border-[#c0c8c9] hover:border-[#1a7a8a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                      <span className="text-[#1a7a8a] font-bold text-sm">
                        {student.name?.charAt(0)?.toUpperCase() || "ط"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#001f24]">{student.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{student.studentId || "STU-000"}</span>
                        <span className="text-gray-300">•</span>
                        <span>{student.email}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStudent(student._id)}
                    disabled={isRemoving === student._id}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    {isRemoving === student._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserMinus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24]">
              <UserPlus className="h-5 w-5 inline ml-2" />
              إضافة طالب
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 border border-[#c0c8c9] rounded-lg p-2">
              {availableStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">لا يوجد طلاب متاحون</p>
                </div>
              ) : (
                availableStudents.map((student: any) => (
                  <label
                    key={student._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedStudentId === student._id
                        ? "border-[#1a7a8a] bg-[#e0f5f7]"
                        : "border-[#c0c8c9] hover:border-[#1a7a8a]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="student"
                      value={student._id}
                      checked={selectedStudentId === student._id}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-4 h-4 text-[#1a7a8a]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddStudentOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleAddStudent}
              disabled={!selectedStudentId || isAdding}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 ml-2" />
              )}
              إضافة الطالب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}