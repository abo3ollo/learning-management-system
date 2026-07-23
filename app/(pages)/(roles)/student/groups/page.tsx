// app/(pages)/(roles)/student/groups/page.tsx

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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Users,
  BookOpen,
  CheckCircle,
  Plus,
  Search,
  AlertCircle,
  Calendar,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  PlayCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function StudentGroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState<string | null>(null);

  // جلب بيانات الطالب الحالي
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // جلب المجموعات التي الطالب مسجل فيها
  const myGroups = useQuery(
    api.groups.groups.getStudentGroups,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );
  console.log("myGroups", myGroups);

  // جلب المجموعات المتاحة للتسجيل
  const availableGroups = useQuery(
    api.groups.groups.getAvailableGroupsForStudent,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );


  // جلب الجدول لمجموعة معينة
  const schedule = useQuery(
    api.schedules.schedules.getScheduleByGroup,
    selectedGroupId ? { groupId: selectedGroupId as any } : "skip"
  );

  const liveClasses = useQuery(
    api.liveClasses.liveClasses.getStudentLiveClasses,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  const addStudentToGroup = useMutation(api.groups.groups.addStudentToGroup);

  if (currentUser === undefined || myGroups === undefined || availableGroups === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ التسجيل في المجموعة
  const handleJoinGroup = async (groupId: string) => {
    if (!currentUser) return;

    setIsJoining(groupId);
    setError(null);
    setSuccess(null);

    try {
      await addStudentToGroup({
        groupId: groupId as any,
        studentId: currentUser._id as any,
      });
      setSuccess("تم التسجيل في المجموعة بنجاح!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || "حدث خطأ أثناء التسجيل في المجموعة");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsJoining(null);
    }
  };

  // فلترة المجموعات المتاحة
  const filteredAvailable = availableGroups.filter((g: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      g.name?.toLowerCase().includes(search) ||
      g.subject?.toLowerCase().includes(search) ||
      g.gradeName?.toLowerCase().includes(search)
    );
  });

  // عرض الجدول
  const renderSchedule = (groupId: string) => {
    const groupSchedule = schedule;
    if (!groupSchedule) return null;

    return (
      <div className="mt-4 space-y-3">
        <div className="border-t border-gray-200 pt-3">
          <h4 className="text-sm font-semibold text-[#001f24] mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#1a7a8a]" />
            الجدول الأسبوعي
          </h4>
          <div className="space-y-2">
            {groupSchedule.weekDays?.map((day: any) => (
              <div key={day.day} className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs font-semibold text-[#1a7a8a] mb-1">
                  {DAYS[day.day] || day.day}
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
                          {period.room && (
                            <span className="text-gray-400 text-xs">
                              📍 {period.room}
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
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">
            مجموعاتي
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة المجموعات الدراسية الخاصة بك
          </p>
        </div>
        <Badge className="bg-[#1a7a8a] text-white px-3 py-1">
          {myGroups.length} مجموعات
        </Badge>
      </div>

      {/* رسائل الخطأ والنجاح */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* My Groups */}
      <div>
        <h2 className="text-lg font-semibold text-[#001f24] mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          المجموعات المسجل فيها
        </h2>
        {myGroups.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">لم تسجل في أي مجموعة بعد</p>
            <p className="text-sm text-gray-400">
              تصفح المجموعات المتاحة أدناه للتسجيل
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((group: any) => {
              const isScheduleOpen = showSchedule === group._id;
              return (
                <Card key={group._id} className="border-green-200 bg-green-50/30">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge className="bg-green-500 text-white">مسجل</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="h-4 w-4 text-[#1a7a8a]" />
                        <span>{group.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4 text-[#1a7a8a]" />
                        <span>{group.currentStudents || group.students?.length || 0} طالب</span>
                      </div>
                      {group.supervisorName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4 text-[#1a7a8a]" />
                          <span>المعلم: {group.supervisorName || "غير محدد"}</span>
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        {group.gradeName}
                      </div>

                      {group.liveClasses && group.liveClasses.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-[#1a7a8a] flex items-center gap-1 mb-2">
                            <PlayCircle className="h-3 w-3" />
                            الحصص المباشرة القادمة:
                          </p>
                          <div className="space-y-2">
                            {group.liveClasses.filter((lc: any) => lc.status === "live" || lc.status === "scheduled").map((lc: any) => (
                              <div key={lc._id} className="flex items-center justify-between p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-[#001f24] truncate">{lc.title}</p>
                                  <p className="text-[10px] text-gray-500">
                                    {new Date(lc.startTime).toLocaleString('ar-EG')}
                                    {lc.status === "live" && (
                                      <span className="text-green-600 font-medium mr-2">• مباشر الآن</span>
                                    )}
                                  </p>
                                </div>
                                <a
                                  href={lc.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0 ${lc.status === "live"
                                    ? "bg-green-600 hover:bg-green-700 text-white animate-pulse"
                                    : "bg-[#1a7a8a] hover:bg-[#15707e] text-white"
                                    }`}
                                >
                                  <PlayCircle className="h-3 w-3" />
                                  {lc.status === "live" ? "انضم الآن" : "عرض"}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* زر عرض الجدول */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 gap-2"
                        onClick={() => {
                          setSelectedGroupId(group._id);
                          setShowSchedule(isScheduleOpen ? null : group._id);
                        }}
                      >
                        <Calendar className="h-4 w-4" />
                        {isScheduleOpen ? "إخفاء الجدول" : "عرض الجدول"}
                        {isScheduleOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>

                      {/* عرض الجدول */}
                      {isScheduleOpen && (
                        <div className="mt-3">
                          {selectedGroupId === group._id && schedule ? (
                            renderSchedule(group._id)
                          ) : (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-[#1a7a8a]" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Groups */}
      <div>
        <h2 className="text-lg font-semibold text-[#001f24] mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-[#1a7a8a]" />
          مجموعات متاحة للتسجيل
        </h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث عن مجموعة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {filteredAvailable.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">
              {searchQuery ? "لا توجد نتائج تطابق بحثك" : "لا توجد مجموعات متاحة"}
            </p>
            <p className="text-sm text-gray-400">
              {searchQuery
                ? "جرب كلمات بحث مختلفة"
                : "جميع المجموعات في صفك قد اكتملت"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAvailable.map((group: any) => {
              const isFull = group.students.length >= group.maxStudents;
              const isJoiningThis = isJoining === group._id;

              return (
                <Card key={group._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          isFull
                            ? "border-red-500 text-red-600"
                            : "border-green-500 text-green-600"
                        }
                      >
                        {group.students.length}/{group.maxStudents}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="h-4 w-4 text-[#1a7a8a]" />
                        <span>{group.subject}</span>
                      </div>
                      {group.supervisorName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4 text-[#1a7a8a]" />
                          <span>المعلم: {group.supervisorName}</span>
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        {group.gradeName}
                      </div>
                      {group.location && (
                        <div className="text-sm text-gray-500">
                          📍 {group.location}
                        </div>
                      )}



                      <Button
                        className="w-full mt-2 bg-[#001f24] hover:bg-[#03363d] text-white"
                        disabled={isFull || isJoiningThis}
                        onClick={() => handleJoinGroup(group._id)}
                      >
                        {isJoiningThis ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            جاري التسجيل...
                          </>
                        ) : isFull ? (
                          "المجموعة مكتملة"
                        ) : (
                          "تسجيل في المجموعة"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}