// app/(pages)/(roles)/teacher/groups/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
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
  Loader2,
  Users,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { AddGroupModal } from "@/app/_components/Admin/AddGroupModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// أيام الأسبوع
const DAYS: Record<string, string> = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

function TeacherGroupCard({ 
  group, 
  onDelete, 
  onAddStudent,
  currentUser 
}: { 
  group: any; 
  onDelete: (id: string) => void;
  onAddStudent: (groupId: string) => void;
  currentUser: any;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف المجموعة "${group.name}"؟`)) return;
    setIsDeleting(true);
    await onDelete(group._id);
    setIsDeleting(false);
  };

  const getDayLabel = (day: string) => DAYS[day] || day;

  // عرض الجدول
  const renderSchedule = () => {
    const schedule = group.schedule;
    if (!schedule || !schedule.weekDays || schedule.weekDays.length === 0) {
      return (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-400">لا يوجد جدول لهذه المجموعة</p>
          <Link href={`/teacher/groups/${group._id}/schedule`}>
            <Button variant="outline" size="sm" className="mt-2">
              <Calendar className="h-4 w-4 ml-2" />
              إضافة جدول
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="mt-3 space-y-3">
        <div className="border-t border-gray-200 pt-3">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {schedule.weekDays.map((day: any) => (
              <div key={day.day} className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs font-semibold text-[#1a7a8a] mb-1">
                  {getDayLabel(day.day)}
                </p>
                {day.periods?.length === 0 ? (
                  <p className="text-xs text-gray-400">لا توجد حصص</p>
                ) : (
                  <div className="space-y-1">
                    {day.periods?.map((period: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">
                            {period.startTime} - {period.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">
                            {period.subject}
                          </span>
                          {period.teacherName && (
                            <span className="text-gray-400 text-xs">
                              👨‍🏫 {period.teacherName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Link href={`/teacher/groups/${group._id}/schedule`}>
            <Button variant="ghost" size="sm" className="w-full mt-2 text-[#1a7a8a]">
              إدارة الجدول
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <p className="text-sm text-gray-500">{group.nameEn}</p>
          </div>
          <Badge
            className={
              group.status === "active"
                ? "bg-green-100 text-green-700"
                : group.status === "completed"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }
          >
            {group.status === "active"
              ? "نشط"
              : group.status === "completed"
              ? "مكتمل"
              : "غير نشط"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen className="h-4 w-4 text-[#1a7a8a]" />
            <span>المادة: {group.subject}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-[#1a7a8a]" />
            <span>
              {group.students?.length || 0} / {group.maxStudents} طالب
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-500">الصف: {group.gradeName}</span>
          </div>

          {/* الإجازات */}
          {group.schedule?.holidays && group.schedule.holidays.length > 0 && (
            <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                <Ban className="h-3 w-3" />
                الإجازات القادمة:
              </p>
              <div className="space-y-1 mt-1">
                {group.schedule.holidays.map((holiday: any, idx: number) => (
                  <p key={idx} className="text-xs text-amber-600">
                    {new Date(holiday.date).toLocaleDateString('ar-EG')} - {holiday.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* زر عرض الجدول */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 gap-2"
            onClick={() => setShowSchedule(!showSchedule)}
          >
            <Calendar className="h-4 w-4" />
            {showSchedule ? "إخفاء الجدول" : "عرض الجدول"}
            {showSchedule ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {/* عرض الجدول */}
          {showSchedule && renderSchedule()}

          {/* الأزرار السفلية */}
          <div className="flex items-center gap-2 mt-3">
            {/* ✅ زر الجدول - يذهب إلى صفحة إدارة الجدول */}
            <Link href={`/teacher/groups/${group._id}/schedule`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full gap-1">
                <Calendar className="h-4 w-4" />
                الجدول
              </Button>
            </Link>
            
            {/* ✅ زر إضافة طالب */}
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 gap-1"
              onClick={() => onAddStudent(group._id)}
            >
              <UserPlus className="h-4 w-4" />
              إضافة طالب
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherGroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  // جلب مجموعات المعلم
  const groups = useQuery(api.groups.groups.getTeacherGroups, {
    search: searchQuery || undefined,
  });

  // جلب الصفوف المتاحة للمعلم
  const grades = useQuery(api.grades.grades.getActiveGrades, {});

  // جلب المستخدم الحالي
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // جلب الطلاب المتاحين للإضافة
  const availableStudents = useQuery(
    api.groups.groups.getAvailableStudentsForGroup,
    selectedGroupId ? { groupId: selectedGroupId as any, search: "" } : "skip"
  );

  const deleteGroup = useMutation(api.groups.groups.deleteGroup);
  const addStudent = useMutation(api.groups.groups.addStudentToGroup);

  if (groups === undefined || grades === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroup({ groupId: groupId as any });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء حذف المجموعة");
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId || !selectedGroupId) return;

    setIsAdding(true);
    try {
      await addStudent({
        groupId: selectedGroupId as any,
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

  const openAddStudentModal = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedStudentId("");
    setIsAddStudentOpen(true);
  };

  const filteredGroups = groups.filter((g: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      g.name?.toLowerCase().includes(search) ||
      g.nameEn?.toLowerCase().includes(search) ||
      g.subject?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">
            مجموعاتي
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة المجموعات التي قمت بإنشائها
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          إنشاء مجموعة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">إجمالي المجموعات</p>
              <p className="text-2xl font-bold">{groups.length}</p>
            </div>
            <Users className="h-8 w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">مجموعات نشطة</p>
              <p className="text-2xl font-bold text-green-500">
                {groups.filter((g: any) => g.status === "active").length}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">إجمالي الطلاب</p>
              <p className="text-2xl font-bold text-[#1a7a8a]">
                {groups.reduce((acc: number, g: any) => acc + (g.students?.length || 0), 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="بحث عن مجموعة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
              إنشاء مجموعة
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group: any) => (
            <TeacherGroupCard
              key={group._id}
              group={group}
              onDelete={handleDeleteGroup}
              onAddStudent={openAddStudentModal}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {/* Add Group Modal */}
      <AddGroupModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Refresh data
        }}
      />

      {/* Add Student Dialog */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24]">
              <UserPlus className="h-5 w-5 inline ml-2" />
              إضافة طالب
            </DialogTitle>
            <p className="text-sm text-gray-500">
              اختر طالباً لإضافته إلى المجموعة
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اختر الطالب</Label>
              <Select
                value={selectedStudentId}
                onValueChange={(value: string | null) => {
                  setSelectedStudentId(value || "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر طالب" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents?.map((student: any) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.name} - {student.email}
                    </SelectItem>
                  ))}
                  {(!availableStudents || availableStudents.length === 0) && (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      لا يوجد طلاب متاحون
                    </div>
                  )}
                </SelectContent>
              </Select>
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
    </div>
  );
}