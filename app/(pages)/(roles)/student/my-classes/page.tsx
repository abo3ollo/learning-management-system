// app/(pages)/(roles)/student/my-classes/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    BookOpen,
    Calendar,
    Users,
    User,
    MapPin,
    School,
    GraduationCap,
    Clock,
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    ExternalLink,
    UserPlus,
    Building2,
    CalendarDays,
    FileText,
} from "lucide-react";
import { FaChalkboardTeacher } from "react-icons/fa";

export default function StudentMyClassesPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();
    const currentUser = useQuery(api.user.auth.getCurrentUser);

    // جلب بيانات الطالب مع الفصل
    const studentData = useQuery(api.user.students.getStudentWithClass,
        currentUser?._id ? { studentId: currentUser._id as any } : "skip"
    );
    console.log("studentData:", studentData);

    const [selectedDay, setSelectedDay] = useState<string>("السبت");

    useEffect(() => {
        if (!isLoaded || !isSignedIn) {
            router.push("/");
            return;
        }

        if (currentUser !== undefined && currentUser?.role !== "student") {
            router.push("/dashboard");
        }
    }, [isLoaded, isSignedIn, currentUser, router]);

    if (!isLoaded || !currentUser || currentUser.role !== "student") {
        return (
            <div className="flex items-center justify-center h-full bg-[#f7fafa]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001f24]"></div>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="flex items-center justify-center h-full bg-[#f7fafa]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001f24]"></div>
            </div>
        );
    }

    const { student, class: classData, teachers, classmates, subjects } = studentData;

    // أيام الأسبوع
    const daysOfWeek = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];

    return (
        <div className="min-h-full bg-[#f7fafa] p-6" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#001f24]">فصلي</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            عرض معلومات فصلك الدراسي وتفاصيله والدخول
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            مجموع الصف ({classData?.currentStudents || 0})
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Class Info Card */}
                        <div className="bg-white rounded-xl border border-[#c0c8c9] p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#001f24]">
                                        {classData?.grade || "لم يتم تعيين الصف"}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                         - شعبة {classData?.section || ""}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 text-xs rounded-full ${classData?.status === "active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {classData?.status === "active" ? "نشط" : "غير نشط"}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-[#1a7a8a]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">العام الدراسي</p>
                                        <p className="text-sm font-semibold text-[#001f24]">{classData?.academicYear || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center">
                                        <MapPin className="h-5 w-5 text-[#1a7a8a]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">الموقع</p>
                                        <p className="text-sm font-semibold text-[#001f24]">{classData?.location || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center">
                                        <Users className="h-5 w-5 text-[#1a7a8a]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">عدد الطلاب</p>
                                        <p className="text-sm font-semibold text-[#001f24]">{classData?.currentStudents || 0}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center">
                                        <GraduationCap className="h-5 w-5 text-[#1a7a8a]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">مشرف الفصل</p>
                                        <p className="text-sm font-semibold text-[#001f24]">
                                            {/* {classData?.supervisorName || "غير محدد"} */}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="bg-white rounded-xl border border-[#c0c8c9] p-6">
                            <h3 className="text-lg font-semibold text-[#001f24] mb-4">جدول اليوم</h3>

                            {/* Day selector */}
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                {daysOfWeek.map((day) => (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDay(day)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedDay === day
                                                ? "bg-[#001f24] text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>

                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">لا توجد حصص محددة لهذا اليوم</p>
                            </div>
                        </div>

                        {/* Subjects */}
                        <div className="bg-white rounded-xl border border-[#c0c8c9] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-[#001f24]">المواد الدراسية</h3>
                                <span className="text-sm text-gray-500">{subjects?.length || 0} مادة</span>
                            </div>

                            {subjects && subjects.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {subjects.map((subject: any) => (
                                        <div key={subject._id} className="flex items-center gap-3 p-3 bg-[#f7fafa] rounded-lg hover:bg-[#e0f5f7] transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-[#e0f5f7] flex items-center justify-center">
                                                <BookOpen className="h-5 w-5 text-[#1a7a8a]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-[#001f24]">{subject.title}</p>
                                                <p className="text-xs text-gray-500">{subject.teacherName || "معلم"}</p>
                                            </div>
                                            <Link href={`/student/courses/${subject._id}`}>
                                                <button className="text-[#1a7a8a] hover:text-[#001f24]">
                                                    <ExternalLink className="h-4 w-4" />
                                                </button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500">لا توجد مواد دراسية</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Quick Links */}
                        <div className="bg-white rounded-xl border border-[#c0c8c9] p-6">
                            <h3 className="text-sm font-semibold text-[#001f24] mb-4">روابط سريعة</h3>
                            <div className="space-y-2">
                                <Link
                                    href="/student/assignments"
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f7fafa] transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <span className="text-sm text-gray-700 group-hover:text-[#001f24]">عمومي</span>
                                </Link>
                                <Link
                                    href="/student/certificates"
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f7fafa] transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                        <GraduationCap className="h-4 w-4 text-green-500" />
                                    </div>
                                    <span className="text-sm text-gray-700 group-hover:text-[#001f24]">وطني</span>
                                </Link>
                                <Link
                                    href="/student/teachers"
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f7fafa] transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                        <FaChalkboardTeacher className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <span className="text-sm text-gray-700 group-hover:text-[#001f24]">يبحث</span>
                                </Link>
                            </div>
                        </div>

                        {/* Classmates */}
                        {/* <div className="bg-white rounded-xl border border-[#c0c8c9] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-[#001f24]">الزملاء</h3>
                                <span className="text-xs text-gray-500">{classmates?.length || 0} زميل</span>
                            </div>

                            {classmates && classmates.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {classmates.map((classmate: any) => (
                                        <div key={classmate._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f7fafa] transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                                                <span className="text-[#1a7a8a] font-bold text-sm">
                                                    {classmate.name?.charAt(0)?.toUpperCase() || "?"}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-[#001f24]">{classmate.name}</p>
                                                <p className="text-xs text-gray-500">{classmate.studentId || ""}</p>
                                            </div>
                                            <button className="text-[#1a7a8a] hover:text-[#001f24]">
                                                <UserPlus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">لا يوجد زملاء</p>
                                </div>
                            )}

                            
                            <div className="mt-4">
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="البحث عن الزملاء..."
                                        className="w-full border border-[#c0c8c9] rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
                                    />
                                </div>
                            </div>
                        </div> */}

                        {/* Teachers */}
                        <div className="bg-white rounded-xl border border-[#c0c8c9] p-6">
                            <h3 className="text-sm font-semibold text-[#001f24] mb-4">المعلمون</h3>

                            {teachers && teachers.length > 0 ? (
                                <div className="space-y-3">
                                    {teachers.map((teacher: any) => (
                                        <div key={teacher._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f7fafa] transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                <span className="text-purple-600 font-bold text-sm">
                                                    {teacher.name?.charAt(0)?.toUpperCase() || "?"}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-[#001f24]">{teacher.name}</p>
                                                <p className="text-xs text-gray-500">{teacher.specialization || "معلم"}</p>
                                            </div>
                                            <Link href={`/student/teachers/${teacher._id}`}>
                                                <button className="text-[#1a7a8a] hover:text-[#001f24]">
                                                    <ExternalLink className="h-4 w-4" />
                                                </button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <FaChalkboardTeacher className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">لا يوجد معلومات</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}