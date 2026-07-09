// app/(pages)/(roles)/teacher/classes/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
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
  Plus,
  Search,
  Users,
  BookOpen,
  Calendar,
  Loader2,
  School,
  GraduationCap,
  Eye,
  UserPlus,
  Code,
} from "lucide-react";
import Link from "next/link";
import { AddNewClass } from "@/app/_components/Teacher/AddNewClass";
import { AddStudentToClassDialog } from "@/app/_components/Teacher/AddStudentToClassDialog";
import { MdSchedule } from "react-icons/md";

// ✅ مكون المجموعة (Class Card)
function ClassCard({
  classData,
  onAddStudent
}: {
  classData: any;
  onAddStudent: (classId: string, className: string, classGrade: string) => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{classData.classNameAr}</CardTitle>
            <p className="text-sm text-gray-500">{classData.classNameEn}</p>
          </div>
          <Badge className="bg-[#1a7a8a] text-white">
            {classData.classCode || "G-01"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GraduationCap className="h-4 w-4 text-[#1a7a8a]" />
            <span>{classData.grade || "الصف الأول الثانوي"}</span>
            <span className="text-gray-300">•</span>
            <span>شعبة {classData.section || "أ"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-[#1a7a8a]" />
            <span>{classData.currentStudents || 0} طالب</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-400">
              السعة: {classData.maxStudents || 30}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Code className="h-4 w-4 text-[#1a7a8a]" />
            <span>{classData.classCode || "-"}</span> 
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-[#1a7a8a]" />
            <span>{classData.academicYear || "2025-2026"}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">

            <Link href={`/teacher/classes/${classData._id}/schedule`}>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                الجدول
              </Button>
            </Link>

            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1"
              onClick={() => onAddStudent(classData._id, classData.classNameAr, classData.grade)}
            >
              <UserPlus className="h-4 w-4" />
              الطلاب
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ✅ State للمودال الخاص بالطلاب
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [selectedClassGrade, setSelectedClassGrade] = useState<string>("");

  // جلب الفصول
  const classes = useQuery(api.classes.classes.getClasses, {
    search: searchQuery || undefined,
  });
  console.log("Fetched classes:", classes);

  // حالة التحميل
  if (classes === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ إحصائيات
  const stats = {
    total: classes.length,
    active: classes.filter((c: any) => c.status === "active").length,
    students: classes.reduce((acc: number, c: any) => acc + (c.currentStudents || 0), 0),
  };

  // ✅ فلترة البحث
  const filteredClasses = classes.filter((cls: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      cls.classNameAr?.toLowerCase().includes(search) ||
      cls.classNameEn?.toLowerCase().includes(search) ||
      cls.classCode?.toLowerCase().includes(search) ||
      cls.grade?.toLowerCase().includes(search)
    );
  });

  // ✅ فتح مودال إضافة طالب
  const handleOpenStudentDialog = (classId: string, className: string, classGrade: string) => {
    setSelectedClassId(classId);
    setSelectedClassName(className);
    setSelectedClassGrade(classGrade);
    setIsStudentDialogOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">المجموعات</h1>
          <p className="text-sm text-gray-500 mt-1">
            إنشاء وإدارة المجموعات الدراسية وتسجيل الطلاب
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          إنشاء مجموعة جديدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">إجمالي المجموعات</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <School className="h-8 w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">مجموعات نشطة</p>
              <p className="text-2xl font-bold text-green-500">{stats.active}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">إجمالي الطلاب</p>
              <p className="text-2xl font-bold text-[#1a7a8a]">{stats.students}</p>
            </div>
            <GraduationCap className="h-8 w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-50 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث عن مجموعة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline" className="gap-2" size="sm">
          <Calendar className="h-4 w-4" />
          العام الدراسي 2025-2026
        </Button>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <Card className="p-12 text-center">
          <School className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">لا توجد مجموعات</h3>
          <p className="text-gray-400">
            {searchQuery ? "لا توجد نتائج تطابق بحثك" : "قم بإنشاء مجموعة جديدة"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              <Plus className="h-4 w-4 ml-2" />
              إنشاء مجموعة جديدة
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="text-sm text-gray-500">
            عرض {filteredClasses.length} مجموعة
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls: any) => (
              <ClassCard
                key={cls._id}
                classData={cls}
                onAddStudent={handleOpenStudentDialog}
              />
            ))}
          </div>
        </>
      )}

      {/* ✅ Add New Class Modal */}
      <AddNewClass
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // يمكن إعادة تحميل البيانات هنا
        }}
      />

      {/* ✅ Add Student to Class Dialog */}
      <AddStudentToClassDialog
        isOpen={isStudentDialogOpen}
        onClose={() => {
          setIsStudentDialogOpen(false);
          setSelectedClassId("");
          setSelectedClassName("");
          setSelectedClassGrade("");
        }}
        classId={selectedClassId}
        classGrade={selectedClassGrade}
        onSuccess={() => {
          // تحديث البيانات بعد إضافة الطالب
        }}
      />
    </div>
  );
}