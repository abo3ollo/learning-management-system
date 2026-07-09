// app/(pages)/(roles)/teacher/classes/[classId]/schedule/page.tsx

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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    ArrowRight,
    Calendar,
    Clock,
    Plus,
    Trash2,
    Edit,
    Loader2,
    AlertCircle,
    CheckCircle,
    Repeat,
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

// ============================================
// TYPES
// ============================================

interface SchedulePeriod {
    periodNumber: number;
    startTime: string;
    endTime: string;
    subject: string;
    room?: string;
    isBreak: boolean;
    notes?: string;
}

// ============================================
// COMPONENTS
// ============================================

// ✅ مكون عرض اليوم
function DaySchedule({
    day,
    periods,
    onEditPeriod,
    onDeletePeriod,
}: {
    day: string;
    periods: SchedulePeriod[];
    onEditPeriod: (period: SchedulePeriod, index: number) => void;
    onDeletePeriod: (index: number) => void;
}) {
    const dayNames: Record<string, string> = {
        sunday: "الأحد",
        monday: "الإثنين",
        tuesday: "الثلاثاء",
        wednesday: "الأربعاء",
        thursday: "الخميس",
        friday: "الجمعة",
        saturday: "السبت",
    };

    return (
        <div className="border border-[#c0c8c9] rounded-lg overflow-hidden">
            <div className="bg-[#f7fafa] px-4 py-2 border-b border-[#c0c8c9] flex justify-between items-center">
                <h4 className="font-semibold text-[#001f24]">{dayNames[day] || day}</h4>
                <Badge variant="outline" className="text-xs">
                    {periods.length} حصص
                </Badge>
            </div>
            <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
                {periods.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">لا توجد حصص</p>
                ) : (
                    periods.map((period, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-2 rounded-lg border ${period.isBreak
                                    ? "bg-gray-50 border-gray-200"
                                    : "bg-white border-[#c0c8c9] hover:border-[#1a7a8a]"
                                } transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-16 text-sm font-medium text-[#1a7a8a]">
                                    {period.startTime} - {period.endTime}
                                </div>
                                <div>
                                    <p className="text font-medium text-[#001f24]">
                                        {period.isBreak ? "⏸️ استراحة" : period.subject}
                                    </p>
                                    {period.room && (
                                        <p className="text-xs text-gray-500">غرفة: {period.room}</p>
                                    )}
                                </div>
                                <div>
                                    {period.notes && (
                                        <p className="text-sm text-gray-500"> {period.notes}</p>
                                    )}
                                </div>
                            </div>
                            {!period.isBreak && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEditPeriod(period, index)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDeletePeriod(index)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ClassSchedulePage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;

    // ✅ State
    const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
    const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false);
    const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<{
        day: string;
        index: number;
        period: SchedulePeriod;
    } | null>(null);

    // ✅ Form State
    const [periodForm, setPeriodForm] = useState({
        day: "saturday",
        startTime: "08:00",
        endTime: "09:00",
        subject: "",
        room: "",
        isBreak: false,
        notes: "",
    });

    const [holidayForm, setHolidayForm] = useState({
        date: "",
        reason: "",
        type: "holiday",
    });

    // ✅ جلب بيانات الفصل
    const classData = useQuery(
        api.classes.classes.getClassById,
        classId ? { classId: classId as any } : "skip"
    );

    // ✅ جلب الجدول
    const schedule = useQuery(
        api.schedules.schedules.getClassSchedule,
        classId ? { classId: classId as any } : "skip"
    );
    console.log(schedule);

    // ✅ Mutations
    const addPeriod = useMutation(api.schedules.schedules.addPeriod);
    const updatePeriod = useMutation(api.schedules.schedules.updatePeriod);
    const deletePeriod = useMutation(api.schedules.schedules.deletePeriod);
    const addHoliday = useMutation(api.schedules.schedules.addHoliday);
    const deleteHoliday = useMutation(api.schedules.schedules.deleteHoliday);

    // حالة التحميل
    if (classData === undefined || schedule === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="container mx-auto p-6" dir="rtl">
                <Card className="p-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">الفصل غير موجود</h2>
                    <Link href="/teacher/classes">
                        <Button className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white">
                            <ArrowRight className="h-4 w-4 ml-2" />
                            العودة للفصول
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    // ✅ أيام الأسبوع
    const daysOfWeek = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

    // ✅ جدول كل يوم
    const getDayPeriods = (day: string): SchedulePeriod[] => {
        const dayData = schedule?.weekDays?.find((d: any) => d.day === day);
        return dayData?.periods || [];
    };

    // ✅ إضافة حصة
    const handleAddPeriod = async () => {
        try {
            const periodData = {
                periodNumber: getDayPeriods(periodForm.day).length + 1,
                startTime: periodForm.startTime,
                endTime: periodForm.endTime,
                subject: periodForm.subject,
                room: periodForm.room || undefined,
                isBreak: periodForm.isBreak,
                notes: periodForm.notes || undefined,
            };

            await addPeriod({
                classId: classId as any,
                day: periodForm.day,
                period: periodData,
            });
            setIsAddPeriodOpen(false);
            setPeriodForm({
                day: "saturday",
                startTime: "08:00",
                endTime: "09:00",
                subject: "",
                room: "",
                isBreak: false,
                notes: "",
            });
        } catch (error) {
            console.error("Error adding period:", error);
            alert("حدث خطأ أثناء إضافة الحصة");
        }
    };

    // ✅ تعديل حصة
    const handleEditPeriod = async () => {
        if (!editingPeriod) return;

        try {
            const periodData = {
                periodNumber: editingPeriod.period.periodNumber,
                startTime: periodForm.startTime,
                endTime: periodForm.endTime,
                subject: periodForm.subject,
                room: periodForm.room || undefined,
                isBreak: periodForm.isBreak,
                notes: periodForm.notes || undefined,
            };

            await updatePeriod({
                classId: classId as any,
                day: editingPeriod.day,
                periodIndex: editingPeriod.index,
                period: periodData,
            });
            setIsEditPeriodOpen(false);
            setEditingPeriod(null);
        } catch (error) {
            console.error("Error updating period:", error);
            alert("حدث خطأ أثناء تحديث الحصة");
        }
    };

    // ✅ حذف حصة
    const handleDeletePeriod = async (day: string, index: number) => {
        if (!confirm("هل أنت متأكد من حذف هذه الحصة؟")) return;

        try {
            await deletePeriod({
                classId: classId as any,
                day: day,
                periodIndex: index,
            });
        } catch (error) {
            console.error("Error deleting period:", error);
            alert("حدث خطأ أثناء حذف الحصة");
        }
    };

    // ✅ فتح تعديل الحصة
    const openEditPeriod = (day: string, period: SchedulePeriod, index: number) => {
        setEditingPeriod({ day, index, period });
        setPeriodForm({
            day: day,
            startTime: period.startTime,
            endTime: period.endTime,
            subject: period.subject,
            room: period.room || "",
            isBreak: period.isBreak,
            notes: period.notes || "",
        });
        setIsEditPeriodOpen(true);
    };

    // ✅ إضافة عطلة
    const handleAddHoliday = async () => {
        if (!holidayForm.date || !holidayForm.reason) {
            alert("يرجى إدخال التاريخ والسبب");
            return;
        }

        try {
            await addHoliday({
                classId: classId as any,
                date: new Date(holidayForm.date).getTime(),
                reason: holidayForm.reason,
                type: holidayForm.type as "holiday" | "exception",
            });
            setIsAddHolidayOpen(false);
            setHolidayForm({ date: "", reason: "", type: "holiday" });
        } catch (error) {
            console.error("Error adding holiday:", error);
            alert("حدث خطأ أثناء إضافة العطلة");
        }
    };

    // ✅ حذف عطلة
    const handleDeleteHoliday = async (index: number) => {
        if (!confirm("هل أنت متأكد من حذف هذه العطلة؟")) return;

        try {
            await deleteHoliday({
                classId: classId as any,
                holidayIndex: index,
            });
        } catch (error) {
            console.error("Error deleting holiday:", error);
            alert("حدث خطأ أثناء حذف العطلة");
        }
    };

    // ✅ الإجازات والاستثناءات
    const holidays = schedule?.holidays || [];

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
            {/* Back Button */}
            <Link href={`/teacher/classes/${classId}`}>
                <Button variant="ghost" className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    العودة للفصل
                </Button>
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">
                        إدارة المواعيد
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        تظهر مواعيد المجموعات الدراسية • {classData.classNameAr}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsAddHolidayOpen(true)}
                        className="gap-2"
                    >
                        <Ban className="h-4 w-4" />
                        إضافة عطلة
                    </Button>
                    <Button
                        onClick={() => setIsAddPeriodOpen(true)}
                        className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        إضافة حصة
                    </Button>
                </div>
            </div>

            {/* Schedule Grid */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Repeat className="h-5 w-5 text-[#1a7a8a]" />
                            الجدول الأسبوعي المتكرر
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                            {schedule?.weekDays?.reduce((acc: number, d: any) => acc + d.periods.length, 0) || 0} حصة
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {daysOfWeek.map((day) => (
                            <DaySchedule
                                key={day}
                                day={day}
                                periods={getDayPeriods(day)}
                                onEditPeriod={(period, index) => openEditPeriod(day, period, index)}
                                onDeletePeriod={(index) => handleDeletePeriod(day, index)}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Holidays Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Ban className="h-5 w-5 text-[#1a7a8a]" />
                        الإجازات والاستثناءات ({holidays.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {holidays.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500">لا توجد إجازات أو استثناءات مسجلة</p>
                            <Button
                                variant="outline"
                                onClick={() => setIsAddHolidayOpen(true)}
                                className="mt-2"
                            >
                                <Plus className="h-4 w-4 ml-2" />
                                إضافة عطلة
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {holidays.map((holiday: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]"
                                >
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-[#1a7a8a]" />
                                        <div>
                                            <p className="font-medium text-[#001f24]">
                                                {holiday.reason}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(holiday.date).toLocaleDateString("ar-EG")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={
                                                holiday.type === "holiday"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-amber-100 text-amber-700"
                                            }
                                        >
                                            {holiday.type === "holiday" ? "عطلة رسمية" : "استثناء"}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteHoliday(index)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ✅ Add Period Dialog */}
            <Dialog open={isAddPeriodOpen} onOpenChange={setIsAddPeriodOpen}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#001f24]">
                            <Plus className="h-5 w-5 inline ml-2" />
                            إضافة حصة يدوية
                        </DialogTitle>
                        <p className="text-sm text-gray-500">
                            إضافة حصة واحدة بتاريخ ووقت محدد
                        </p>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="day">اليوم</Label>
                            <Select
                                value={periodForm.day}
                                onValueChange={(value) =>
                                    value !== null && setPeriodForm({ ...periodForm, day: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر اليوم" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="saturday">السبت</SelectItem>
                                    <SelectItem value="sunday">الأحد</SelectItem>
                                    <SelectItem value="monday">الإثنين</SelectItem>
                                    <SelectItem value="tuesday">الثلاثاء</SelectItem>
                                    <SelectItem value="wednesday">الأربعاء</SelectItem>
                                    <SelectItem value="thursday">الخميس</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">من</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={periodForm.startTime}
                                    onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">إلى</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={periodForm.endTime}
                                    onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">المادة</Label>
                            <Input
                                id="subject"
                                value={periodForm.subject}
                                onChange={(e) => setPeriodForm({ ...periodForm, subject: e.target.value })}
                                placeholder="اسم المادة"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="room">الغرفة</Label>
                            <Input
                                id="room"
                                value={periodForm.room}
                                onChange={(e) => setPeriodForm({ ...periodForm, room: e.target.value })}
                                placeholder="رقم الغرفة (اختياري)"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                            <Input
                                id="notes"
                                value={periodForm.notes}
                                onChange={(e) => setPeriodForm({ ...periodForm, notes: e.target.value })}
                                placeholder="حصة تعويضية..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsAddPeriodOpen(false)}>
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleAddPeriod}
                            className="bg-[#001f24] hover:bg-[#03363d] text-white"
                        >
                            إضافة الحصة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ✅ Edit Period Dialog */}
            <Dialog open={isEditPeriodOpen} onOpenChange={setIsEditPeriodOpen}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#001f24]">
                            <Edit className="h-5 w-5 inline ml-2" />
                            تعديل الحصة
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-startTime">من</Label>
                                <Input
                                    id="edit-startTime"
                                    type="time"
                                    value={periodForm.startTime}
                                    onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-endTime">إلى</Label>
                                <Input
                                    id="edit-endTime"
                                    type="time"
                                    value={periodForm.endTime}
                                    onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-subject">المادة</Label>
                            <Input
                                id="edit-subject"
                                value={periodForm.subject}
                                onChange={(e) => setPeriodForm({ ...periodForm, subject: e.target.value })}
                                placeholder="اسم المادة"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-room">الغرفة</Label>
                            <Input
                                id="edit-room"
                                value={periodForm.room}
                                onChange={(e) => setPeriodForm({ ...periodForm, room: e.target.value })}
                                placeholder="رقم الغرفة (اختياري)"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsEditPeriodOpen(false)}>
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleEditPeriod}
                            className="bg-[#001f24] hover:bg-[#03363d] text-white"
                        >
                            حفظ التعديلات
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ✅ Add Holiday Dialog */}
            <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#001f24]">
                            <Ban className="h-5 w-5 inline ml-2" />
                            إضافة عطلة
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="holiday-date">التاريخ</Label>
                            <Input
                                id="holiday-date"
                                type="date"
                                value={holidayForm.date}
                                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="holiday-reason">السبب</Label>
                            <Input
                                id="holiday-reason"
                                value={holidayForm.reason}
                                onChange={(e) => setHolidayForm({ ...holidayForm, reason: e.target.value })}
                                placeholder="عطلة رسمية..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="holiday-type">النوع</Label>
                            <Select
                                value={holidayForm.type}
                                onValueChange={(value) =>
                                    value !== null && setHolidayForm({ ...holidayForm, type: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر النوع" />
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
                            className="bg-[#001f24] hover:bg-[#03363d] text-white"
                        >
                            إضافة العطلة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}