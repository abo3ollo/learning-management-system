"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  FileText,
  Calendar,
  BookOpen,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  Timer,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// ✅ مكونات مخصصة للفلاتر النشطة
const BadgeFilter = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
    {children}
  </span>
);

export default function StudentMyExamsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // جلب امتحانات الطالب
  const exams = useQuery(api.exams.exams.getStudentExams, {
    status: statusFilter as any,
  });

  // جلب المواد
  const courses = useQuery(api.courses.courses.getPublishedCourses, {});

  // حالة التحميل
  if (exams === undefined || courses === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ دوال الترجمة
  const getStatusLabel = (value: string) => {
    const map: Record<string, string> = {
      all: "جميع الحالات",
      pending: "في الانتظار",
      submitted: "مسلم",
      graded: "تم التصحيح",
    };
    return map[value] || value;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "graded":
        return <Badge className="bg-green-500 text-white">تم التصحيح</Badge>;
      case "submitted":
        return <Badge className="bg-amber-500 text-white">في انتظار التصحيح</Badge>;
      case "pending":
        return <Badge className="bg-blue-500 text-white">في الانتظار</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">غير معروف</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "graded":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "submitted":
        return <Clock className="h-5 w-5 text-amber-500 animate-pulse" />;
      case "pending":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTimeRemaining = (examDate: number, duration: number) => {
    const now = Date.now();
    const endTime = examDate + duration * 60 * 1000;
    const diff = endTime - now;

    if (diff <= 0) {
      return { text: "انتهى الوقت", color: "text-red-500", expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return {
        text: `${days} يوم متبقي`,
        color: "text-green-600",
        expired: false,
      };
    } else if (hours > 0) {
      return {
        text: `${hours} ساعة ${minutes} دقيقة متبقي`,
        color: "text-amber-600",
        expired: false,
      };
    } else {
      return {
        text: `${minutes} دقيقة متبقي`,
        color: "text-orange-600",
        expired: false,
      };
    }
  };

  // ✅ دوال التعامل مع تغيير القيم
  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value || "all");
  };

  const handleSubjectChange = (value: string | null) => {
    setSubjectFilter(value || "all");
  };

  // ✅ إعادة ضبط الفلاتر
  const resetFilters = () => {
    setStatusFilter("all");
    setSubjectFilter("all");
    setSearchTerm("");
  };

  // ✅ عدد الفلاتر النشطة
  const activeFiltersCount = [
    statusFilter !== "all",
    subjectFilter !== "all",
    searchTerm !== "",
  ].filter(Boolean).length;

  // ✅ إحصائيات
  const stats = {
    total: exams.length,
    pending: exams.filter((e) => e.status === "pending").length,
    submitted: exams.filter((e) => e.status === "submitted").length,
    graded: exams.filter((e) => e.status === "graded").length,
  };

  // ✅ فلترة البحث والموضوع
  const filteredExams = exams.filter((exam: any) => {
    // فلتر البحث
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const match =
        exam.title?.toLowerCase().includes(search) ||
        exam.subject?.toLowerCase().includes(search);
      if (!match) return false;
    }
    
    // فلتر المادة
    if (subjectFilter !== "all" && exam.courseId !== subjectFilter) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">امتحاناتي</h1>
          <p className="text-sm text-gray-500 mt-1">جميع الامتحانات الخاصة بك وحالة التسليم</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-64">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث في الامتحانات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden relative"
          >
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#1a7a8a] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">الكل</p>
              <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">في الانتظار</p>
              <p className="text-xl md:text-2xl font-bold text-amber-500">{stats.pending}</p>
            </div>
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">مسلم</p>
              <p className="text-xl md:text-2xl font-bold text-blue-500">{stats.submitted}</p>
            </div>
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">تم التصحيح</p>
              <p className="text-xl md:text-2xl font-bold text-green-500">{stats.graded}</p>
            </div>
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* ✅ الفلاتر - تصميم محسن */}
      <div className={`bg-white rounded-lg border border-gray-200 p-4 space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
        {/* صف الفلاتر الرئيسي */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* فلتر الحالة */}
          <div className="flex-1 min-w-37.5">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="جميع الحالات">
                  {getStatusLabel(statusFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="submitted">مسلم</SelectItem>
                <SelectItem value="graded">تم التصحيح</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* فلتر المادة */}
          <div className="flex-1 min-w-37.5">
            <Select value={subjectFilter} onValueChange={handleSubjectChange}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="جميع المواد">
                  {subjectFilter !== "all" 
                    ? courses?.find((c: any) => c._id === subjectFilter)?.title 
                    : "جميع المواد"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المواد</SelectItem>
                {courses?.map((course: any) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={resetFilters}
            className="border-gray-200 text-gray-600 hover:bg-gray-50 gap-2"
          >
            <X className="h-4 w-4" />
            إعادة ضبط
            {activeFiltersCount > 0 && (
              <span className="bg-[#1a7a8a] text-white text-xs rounded-full px-2 py-0.5">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* ✅ الفلاتر النشطة - عرض سريع */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">الفلاتر النشطة:</span>
            {statusFilter !== "all" && (
              <BadgeFilter className="bg-[#e0f5f7] text-[#1a7a8a]">
                الحالة: {getStatusLabel(statusFilter)}
              </BadgeFilter>
            )}
            {subjectFilter !== "all" && (
              <BadgeFilter className="bg-[#e0f5f7] text-[#1a7a8a]">
                المادة: {courses?.find((c: any) => c._id === subjectFilter)?.title}
              </BadgeFilter>
            )}
            {searchTerm && (
              <BadgeFilter className="bg-[#e0f5f7] text-[#1a7a8a]">
                بحث: "{searchTerm}"
              </BadgeFilter>
            )}
          </div>
        )}
      </div>

      {/* ✅ عدد النتائج */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>عرض {filteredExams.length} امتحان</span>
        {activeFiltersCount > 0 && (
          <span className="text-xs text-gray-400">
            {activeFiltersCount} فلتر نشط
          </span>
        )}
      </div>

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">لا توجد امتحانات</h3>
          <p className="text-gray-400">
            {searchTerm ? "لا توجد نتائج تطابق بحثك" : "لم يتم العثور على أي امتحانات"}
          </p>
          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={resetFilters} className="mt-4">
              إزالة جميع الفلاتر
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam: any) => {
            const timeRemaining = getTimeRemaining(exam.date, exam.duration);

            return (
              <Card key={exam._id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2 flex-1">
                      {exam.title}
                    </CardTitle>
                    {getStatusBadge(exam.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* المادة */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                    <span>{exam.subject}</span>
                  </div>

                  {/* التاريخ */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                    <span>
                      {format(new Date(exam.date), "dd MMMM yyyy - HH:mm", {
                        locale: ar,
                      })}
                    </span>
                  </div>

                  {/* المدة */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Timer className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                    <span>{exam.duration} دقيقة</span>
                  </div>

                  {/* الدرجة الكلية */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                    <span>الدرجة الكلية: {exam.totalMarks}</span>
                  </div>

                  {/* الوقت المتبقي */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-[#1a7a8a]" />
                    <span className={timeRemaining.color}>
                      {timeRemaining.text}
                    </span>
                  </div>

                  {/* حالة التسليم */}
                  <div className="flex items-center gap-2 text-sm">
                    {getStatusIcon(exam.status)}
                    <span className="text-gray-600">
                      {exam.status === "graded" &&
                        `الدرجة: ${exam.submission?.totalMarks || 0}`}
                      {exam.status === "submitted" && "في انتظار التصحيح"}
                      {exam.status === "pending" && "في انتظار التسليم"}
                    </span>
                  </div>

                  {/* زر التفاصيل */}
                  {exam.status === "pending" ? (
                    <Link href={`/student/my-exams/${exam._id}`}>
                      <Button className="w-full mt-2 bg-[#001f24] hover:bg-[#03363d] text-white">
                        <Eye className="h-4 w-4 ml-2" />
                        دخول الامتحان
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/student/my-exams/${exam._id}`}>
                      <Button variant="outline" className="w-full mt-2">
                        <ArrowRight className="h-4 w-4 ml-2" />
                        عرض النتيجة
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}