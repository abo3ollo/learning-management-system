// app/(pages)/(roles)/teacher/groups/[groupId]/schedule/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Plus,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Loader2,
  Trash2,
  Save,
  CalendarPlus,
  RefreshCw,
  Ban,
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
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// أيام الأسبوع
const DAYS = [
  { value: "saturday", label: "السبت" },
  { value: "sunday", label: "الأحد" },
  { value: "monday", label: "الإثنين" },
  { value: "tuesday", label: "الثلاثاء" },
  { value: "wednesday", label: "الأربعاء" },
  { value: "thursday", label: "الخميس" },
  { value: "friday", label: "الجمعة" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

export default function TeacherGroupSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [selectedDay, setSelectedDay] = useState<string>("saturday");
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day: "saturday",
    startTime: "16:00",
    endTime: "18:00",
    subject: "",
    room: "",
    notes: "",
  });
  const [newHoliday, setNewHoliday] = useState({
    date: "",
    reason: "",
    type: "holiday" as "holiday" | "exception",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // جلب بيانات المجموعة
  const group = useQuery(
    api.groups.groups.getGroupById,
    groupId ? { groupId: groupId as any } : "skip"
  );

  // جلب الجدول
  const schedule = useQuery(
    api.schedules.schedules.getScheduleByGroup,
    groupId ? { groupId: groupId as any } : "skip"
  );

  // جلب المستخدم الحالي (المعلم)
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  const addScheduleSlot = useMutation(api.schedules.schedules.addScheduleSlot);
  const removeScheduleSlot = useMutation(api.schedules.schedules.removeScheduleSlot);
  const addGroupHoliday = useMutation(api.schedules.schedules.addGroupHoliday);
  const removeHoliday = useMutation(api.schedules.schedules.removeHoliday);
  const generateSchedule = useMutation(api.schedules.schedules.generateSchedule);

  if (group === undefined || schedule === undefined || currentUser === undefined) {
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

  // ✅ التحقق من أن currentUser موجود قبل استخدامه
  if (!currentUser) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">غير مصرح</h2>
          <p className="text-gray-500">يرجى تسجيل الدخول كمعلم</p>
          <Link href="/">
            <Button className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white">
              العودة للرئيسية
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const daySchedule = schedule?.weekDays?.find((d: any) => d.day === selectedDay);
  const daySlots = daySchedule?.periods || [];
  const holidays = schedule?.holidays || [];

  const handleAddSlot = async () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      alert("يرجى تحديد وقت البدء والانتهاء");
      return;
    }

    try {
      await addScheduleSlot({
        groupId: groupId as any,
        day: newSlot.day,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        subject: newSlot.subject || group.subject,
        // ✅ currentUser موجود بالتأكيد هنا
        teacherId: currentUser._id as any,
        room: newSlot.room || undefined,
        notes: newSlot.notes || undefined,
      });

      setIsAddSlotOpen(false);
      setNewSlot({
        day: "saturday",
        startTime: "16:00",
        endTime: "18:00",
        subject: "",
        room: "",
        notes: "",
      });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء إضافة الحصة");
    }
  };

  const handleRemoveSlot = async (periodIndex: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحصة؟")) return;
    try {
      await removeScheduleSlot({
        groupId: groupId as any,
        day: selectedDay,
        periodIndex: periodIndex,
      });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء حذف الحصة");
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date) {
      alert("يرجى تحديد التاريخ");
      return;
    }

    try {
      await addGroupHoliday({
        groupId: groupId as any,
        date: new Date(newHoliday.date).getTime(),
        reason: newHoliday.reason || "عطلة رسمية",
        type: newHoliday.type,
      });

      setIsAddHolidayOpen(false);
      setNewHoliday({ date: "", reason: "", type: "holiday" });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء إضافة الإجازة");
    }
  };

  const handleRemoveHoliday = async (holidayIndex: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الإجازة؟")) return;
    try {
      await removeHoliday({
        groupId: groupId as any,
        holidayIndex: holidayIndex,
      });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء حذف الإجازة");
    }
  };

  const handleGenerateSchedule = async () => {
    if (!confirm("سيتم إنشاء جدول أسبوعي تلقائي. هل أنت متأكد؟")) return;
    setIsGenerating(true);
    try {
      await generateSchedule({
        groupId: groupId as any,
      });
      alert("✅ تم إنشاء الجدول التلقائي بنجاح");
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء إنشاء الجدول");
    } finally {
      setIsGenerating(false);
    }
  };

  const getDayLabel = (day: string) => {
    return DAYS.find(d => d.value === day)?.label || day;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/teacher/groups">
          <Button variant="ghost" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة للمجموعات
          </Button>
        </Link>
        <Link href={`/teacher/groups/${groupId}`}>
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            الطلاب
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24] flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#1a7a8a]" />
            إدارة الجدول
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{group.name}</span>
            <Badge className="bg-[#1a7a8a] text-white">{group.subject}</Badge>
            <span className="text-sm text-gray-500">
              المعلم: {currentUser.name}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setIsAddSlotOpen(true)}
            className="bg-[#1a7a8a] hover:bg-[#15707e] text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة حصة
          </Button>
          <Button
            onClick={() => setIsAddHolidayOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Ban className="h-4 w-4" />
            إضافة إجازة
          </Button>
          <Button
            onClick={handleGenerateSchedule}
            variant="outline"
            className="gap-2"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            توليد تلقائي
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#1a7a8a]">
              {schedule?.weekDays?.reduce((acc: number, d: any) => acc + (d.periods?.length || 0), 0) || 0}
            </p>
            <p className="text-xs text-gray-500">إجمالي الحصص</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {schedule?.weekDays?.filter((d: any) => d.periods?.length > 0).length || 0}
            </p>
            <p className="text-xs text-gray-500">أيام عمل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{holidays.length}</p>
            <p className="text-xs text-gray-500">إجازات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#001f24]">
              {schedule?.weekDays?.find((d: any) => d.day === selectedDay)?.periods?.length || 0}
            </p>
            <p className="text-xs text-gray-500">حصص اليوم</p>
          </CardContent>
        </Card>
      </div>

      {/* Day Selector */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => (
          <Button
            key={day.value}
            variant={selectedDay === day.value ? "default" : "outline"}
            className={selectedDay === day.value ? "bg-[#001f24]" : ""}
            onClick={() => setSelectedDay(day.value)}
          >
            {day.label}
          </Button>
        ))}
      </div>

      {/* Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#1a7a8a]" />
              الجدول الأسبوعي المتكرر
              <Badge variant="outline" className="mr-2">
                {getDayLabel(selectedDay)}
              </Badge>
            </span>
            <span className="text-sm font-normal text-gray-400">
              {daySlots.length} حصة
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {daySlots.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">لا توجد حصص في هذا اليوم</p>
              <Button
                variant="outline"
                onClick={() => setIsAddSlotOpen(true)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة حصة
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {daySlots.map((slot: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg border border-[#c0c8c9] hover:border-[#1a7a8a] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-20">
                      <p className="text-sm font-bold text-[#1a7a8a]">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#001f24]">
                        {slot.subject || group.subject}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>👨‍🏫 {slot.teacherName || currentUser.name}</span>
                        {slot.room && (
                          <span>📍 {slot.room}</span>
                        )}
                        {slot.notes && (
                          <span className="text-amber-600">📝 {slot.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveSlot(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Holidays Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-amber-500" />
            الإجازات والاستثناءات ({holidays.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">لا توجد إجازات أو استثناءات مسجلة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {holidays.map((holiday: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-[#001f24]">
                        {format(new Date(holiday.date), "dd MMMM yyyy", { locale: ar })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {holiday.reason || "عطلة رسمية"}
                        {holiday.type === "exception" && (
                          <Badge className="mr-2 bg-blue-100 text-blue-700">استثناء</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveHoliday(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Slot Dialog */}
      <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24]">
              <CalendarPlus className="h-5 w-5 inline ml-2" />
              إضافة حصة
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اليوم</Label>
              <Select
                value={newSlot.day}
                onValueChange={(value: string | null) => {
                  if (value) setNewSlot({ ...newSlot, day: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر اليوم" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وقت البدء</Label>
                <Select
                  value={newSlot.startTime}
                  onValueChange={(value: string | null) => {
                    if (value) setNewSlot({ ...newSlot, startTime: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="بداية" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>وقت الانتهاء</Label>
                <Select
                  value={newSlot.endTime}
                  onValueChange={(value: string | null) => {
                    if (value) setNewSlot({ ...newSlot, endTime: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتهاء" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>المادة</Label>
              <Input
                value={newSlot.subject}
                onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })}
                placeholder="المادة (اختياري)"
              />
            </div>

            <div className="space-y-2">
              <Label>القاعة</Label>
              <Input
                value={newSlot.room}
                onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                placeholder="رقم القاعة (اختياري)"
              />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Input
                value={newSlot.notes}
                onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
                placeholder="ملاحظات..."
              />
            </div>

            <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                سيتم تعيينك كمعلم لهذه الحصة تلقائياً
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddSlotOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleAddSlot}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة الحصة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Holiday Dialog */}
      <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24]">
              <Ban className="h-5 w-5 inline ml-2" />
              إضافة إجازة
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>السبب</Label>
              <Input
                value={newHoliday.reason}
                onChange={(e) => setNewHoliday({ ...newHoliday, reason: e.target.value })}
                placeholder="عطلة رسمية"
              />
            </div>

            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>النوع</Label>
              <Select
                value={newHoliday.type}
                onValueChange={(value: "holiday" | "exception" | null) => {
                  if (value) setNewHoliday({ ...newHoliday, type: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holiday">عطلة رسمية</SelectItem>
                  <SelectItem value="exception">استثناء</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddHolidayOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleAddHoliday}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Ban className="h-4 w-4 ml-2" />
              إضافة الإجازة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}